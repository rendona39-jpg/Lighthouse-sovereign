// /api/admin.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const ADMIN_TOKEN = process.env.ADMIN_TOKEN!;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  if (token !== ADMIN_TOKEN) {
    return new Response('Unauthorized', { status: 401 });
  }

  const action = url.searchParams.get('action');

  switch (action) {
    case 'quarantine':
      return await getQuarantineItems();

    case 'dojo':
      return await getDojoHistory();

    case 'security':
      return await getSecurityAlerts();

    case 'stats':
      return await getSystemStats();

    default:
      return await getDashboard();
  }
}

export async function POST(req: Request) {
  const { token, action, data } = await req.json();

  if (token !== ADMIN_TOKEN) {
    return new Response('Unauthorized', { status: 401 });
  }

  switch (action) {
    case 'approve_quarantine':
      return await approveQuarantineFact(data.quarantine_id, data.corrected_fact);

    case 'reject_quarantine':
      return await rejectQuarantineFact(data.quarantine_id);

    case 'resolve_security':
      return await resolveSecurityAlert(data.alert_id);

    case 'manual_fact':
      return await insertManualFact(data.org_id, data.fact);

    default:
      return new Response('Unknown action', { status: 400 });
  }
}

async function getDashboard() {
  const [
    totalOrgs,
    totalFacts,
    quarantineCount,
    securityAlerts,
    lastDojo
  ] = await Promise.all([
    supabase.from('organizations').select('count'),
    supabase.from('atomic_fact_spine').select('count'),
    supabase.from('quarantine_ledger').select('count').eq('resolved', false),
    supabase.from('security_alerts').select('count').eq('resolved', false),
    supabase.from('dojo_history').select('*').order('run_at', { ascending: false }).limit(1)
  ]);

  const dojoRun = lastDojo.data?.[0];
  const systemHealthy = dojoRun?.conservation_passed &&
                        dojoRun?.edge_logic_passed &&
                        dojoRun?.ingress_passed &&
                        dojoRun?.immutability_passed;

  return new Response(JSON.stringify({
    stats: {
      total_organizations: totalOrgs.count || 0,
      total_facts: totalFacts.count || 0,
      pending_quarantine: quarantineCount.count || 0,
      active_security_alerts: securityAlerts.count || 0
    },
    last_dojo_run: dojoRun,
    health: systemHealthy ? 'HEALTHY' : 'DEGRADED'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function getQuarantineItems() {
  const { data } = await supabase
    .from('quarantine_ledger')
    .select(`
      *,
      provenance_chain (
        blob_storage_id,
        source_type,
        document_type,
        ingest_timestamp
      )
    `)
    .eq('resolved', false)
    .order('created_at', { ascending: false })
    .limit(50);

  return new Response(JSON.stringify({ quarantine_items: data }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function approveQuarantineFact(quarantineId: string, correctedFact: any) {
  const { data: quarantineItem } = await supabase
    .from('quarantine_ledger')
    .select('*')
    .eq('quarantine_id', quarantineId)
    .single();

  if (!quarantineItem) {
    return new Response('Not found', { status: 404 });
  }

  await supabase.from('atomic_fact_spine').insert({
    org_id: quarantineItem.org_id,
    vector_type: correctedFact.vector_type,
    magnitude: correctedFact.magnitude,
    temporal_anchor: correctedFact.temporal_anchor || new Date().toISOString(),
    triad_map: correctedFact.triad_map,
    provenance_id: quarantineItem.provenance_id,
    confidence: 1.0
  });

  await supabase
    .from('quarantine_ledger')
    .update({ resolved: true })
    .eq('quarantine_id', quarantineId);

  return new Response('OK');
}

async function rejectQuarantineFact(quarantineId: string) {
  await supabase
    .from('quarantine_ledger')
    .update({ resolved: true })
    .eq('quarantine_id', quarantineId);

  return new Response('OK');
}

async function getSecurityAlerts() {
  const { data } = await supabase
    .from('security_alerts')
    .select('*')
    .eq('resolved', false)
    .order('created_at', { ascending: false });

  return new Response(JSON.stringify({ alerts: data }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function resolveSecurityAlert(alertId: string) {
  await supabase
    .from('security_alerts')
    .update({ resolved: true })
    .eq('alert_id', alertId);

  return new Response('OK');
}

async function getDojoHistory() {
  const { data } = await supabase
    .from('dojo_history')
    .select('*')
    .order('run_at', { ascending: false })
    .limit(30);

  return new Response(JSON.stringify({ dojo_runs: data }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function getSystemStats() {
  const { data: orgStats } = await supabase
    .from('conversation_history')
    .select('org_id')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const orgCounts = orgStats?.reduce((acc, row) => {
    acc[row.org_id] = (acc[row.org_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedOrgs = Object.entries(orgCounts || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  return new Response(JSON.stringify({
    top_10_active_orgs: sortedOrgs.map(([org_id, count]) => ({
      org_id,
      messages_last_7d: count
    }))
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function insertManualFact(orgId: string, fact: any) {
  const { data: provenance } = await supabase
    .from('provenance_chain')
    .insert({
      org_id: orgId,
      blob_storage_id: 'MANUAL_ENTRY',
      source_hash: 'MANUAL',
      source_type: 'ADMIN_MANUAL',
      document_type: 'MANUAL'
    })
    .select()
    .single();

  if (!provenance) {
    return new Response('Failed to create provenance', { status: 500 });
  }

  await supabase.from('atomic_fact_spine').insert({
    org_id: orgId,
    vector_type: fact.vector_type,
    magnitude: fact.magnitude,
    temporal_anchor: fact.temporal_anchor || new Date().toISOString(),
    triad_map: fact.triad_map,
    provenance_id: provenance.provenance_id,
    confidence: 1.0
  });

  return new Response('OK');
}
