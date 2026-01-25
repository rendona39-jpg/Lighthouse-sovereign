// /api/cron/dojo.ts

import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function GET(req: Request) {
  try {
    // Kata 1: Conservation Check
    const conservationPassed = await runConservationKata();

    // Kata 2: Edge Logic Verification
    const edgeLogicPassed = await runEdgeLogicKata();

    // Kata 3: Ingress Confidence Gate
    const ingressPassed = await runIngressKata();

    // Kata 4: Immutability Verification
    const immutabilityPassed = await runImmutabilityKata();

    const allPassed = conservationPassed &&
                      edgeLogicPassed &&
                      ingressPassed &&
                      immutabilityPassed;

    // Log results
    await supabase.from('dojo_history').insert({
      conservation_passed: conservationPassed,
      edge_logic_passed: edgeLogicPassed,
      ingress_passed: ingressPassed,
      immutability_passed: immutabilityPassed,
      run_at: new Date().toISOString()
    });

    // Alert admin if any failed
    if (!allPassed) {
      await twilioClient.messages.create({
        body: `🚨 DOJO FAILURE\n\n` +
              `Conservation: ${conservationPassed ? '✅' : '❌'}\n` +
              `Edge Logic: ${edgeLogicPassed ? '✅' : '❌'}\n` +
              `Ingress: ${ingressPassed ? '✅' : '❌'}\n` +
              `Immutability: ${immutabilityPassed ? '✅' : '❌'}`,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: process.env.ADMIN_PHONE!
      });
    }

    return new Response(JSON.stringify({
      passed: allPassed,
      details: {
        conservation: conservationPassed,
        edge_logic: edgeLogicPassed,
        ingress: ingressPassed,
        immutability: immutabilityPassed
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Dojo error:', error);
    return new Response('Error', { status: 500 });
  }
}

async function runConservationKata(): Promise<boolean> {
  const { data: orgs } = await supabase
    .from('organizations')
    .select('org_id');

  if (!orgs || orgs.length === 0) return true;

  for (const org of orgs) {
    const { data } = await supabase
      .rpc('verify_conservation', { p_org_id: org.org_id });

    if (data && data[0] && !data[0].passes) {
      console.error(`Conservation failed for ${org.org_id}`, data[0]);
      return false;
    }
  }

  return true;
}

async function runEdgeLogicKata(): Promise<boolean> {
  const testOrgId = 'TEST-DOJO-' + Date.now();

  try {
    // Insert test provenance
    const { data: testProvenance } = await supabase
      .from('provenance_chain')
      .insert({
        org_id: testOrgId,
        blob_storage_id: 'test',
        source_hash: 'test',
        source_type: 'TEST',
        document_type: 'INVOICE'
      })
      .select()
      .single();

    if (!testProvenance) {
      console.error('Failed to create test provenance');
      return false;
    }

    // Insert test data
    await supabase.from('atomic_fact_spine').insert([
      {
        org_id: testOrgId,
        vector_type: 'POSITIVE',
        magnitude: 1000,
        triad_map: { category: 'sales' },
        provenance_id: testProvenance.provenance_id,
        confidence: 1.0,
        temporal_anchor: new Date().toISOString()
      },
      {
        org_id: testOrgId,
        vector_type: 'NEGATIVE',
        magnitude: 500,
        triad_map: { category: 'food' },
        provenance_id: testProvenance.provenance_id,
        confidence: 1.0,
        temporal_anchor: new Date().toISOString()
      }
    ]);

    // Query edge (should be 2.0)
    const { data } = await supabase
      .from('edge_yield')
      .select('yield_ratio')
      .eq('org_id', testOrgId)
      .single();

    const passed = data && Math.abs(data.yield_ratio - 2.0) < 0.001;

    if (!passed) {
      console.error('Edge logic test failed. Expected yield_ratio 2.0, got:', data?.yield_ratio);
    }

    // Cleanup
    await supabase
      .from('atomic_fact_spine')
      .delete()
      .eq('org_id', testOrgId);

    await supabase
      .from('provenance_chain')
      .delete()
      .eq('org_id', testOrgId);

      return passed === true;


  } catch (error) {
    console.error('Edge logic kata error:', error);
    return false;
  }
}

async function runIngressKata(): Promise<boolean> {
  try {
    // Verify quarantine_ledger table exists and is accessible
    const { data, error } = await supabase
      .from('quarantine_ledger')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Ingress kata failed - quarantine_ledger not accessible:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Ingress kata error:', error);
    return false;
  }
}

async function runImmutabilityKata(): Promise<boolean> {
  const testOrgId = 'TEST-IMMUTABLE-' + Date.now();

  try {
    // Create test provenance
    const { data: testProvenance } = await supabase
      .from('provenance_chain')
      .insert({
        org_id: testOrgId,
        blob_storage_id: 'test-immutable',
        source_hash: 'test-immutable',
        source_type: 'TEST',
        document_type: 'INVOICE'
      })
      .select()
      .single();

    if (!testProvenance) {
      console.error('Failed to create test provenance for immutability test');
      return false;
    }

    // Insert test fact
    const { data: inserted } = await supabase
      .from('atomic_fact_spine')
      .insert({
        org_id: testOrgId,
        vector_type: 'POSITIVE',
        magnitude: 999,
        triad_map: { category: 'test' },
        provenance_id: testProvenance.provenance_id,
        confidence: 1.0
      })
      .select()
      .single();

    if (!inserted) {
      console.error('Failed to insert test fact for immutability test');
      return false;
    }

    // Attempt UPDATE (should fail due to trigger)
    let updateFailed = false;
    try {
      await supabase
        .from('atomic_fact_spine')
        .update({ magnitude: 1000 })
        .eq('fact_id', inserted.fact_id);

      // If we get here, trigger is broken
      console.error('CRITICAL: Immutability trigger is not active - UPDATE succeeded when it should have failed');
      return false;
    } catch (updateError: any) {
      // Expected: trigger should prevent update
      if (updateError.message?.includes('immutable') ||
          updateError.message?.includes('Atomic facts are immutable')) {
        updateFailed = true;
      } else {
        console.error('UPDATE failed but not due to immutability trigger:', updateError);
        return false;
      }
    }

    // Attempt DELETE (should fail due to trigger)
    let deleteFailed = false;
    try {
      await supabase
        .from('atomic_fact_spine')
        .delete()
        .eq('fact_id', inserted.fact_id);

      // If we get here, trigger is broken
      console.error('CRITICAL: Immutability trigger is not active - DELETE succeeded when it should have failed');
      return false;
    } catch (deleteError: any) {
      // Expected: trigger should prevent delete
      if (deleteError.message?.includes('immutable') ||
          deleteError.message?.includes('Atomic facts are immutable')) {
        deleteFailed = true;
      } else {
        console.error('DELETE failed but not due to immutability trigger:', deleteError);
        return false;
      }
    }

    // Both operations should have failed due to triggers
    const passed = updateFailed && deleteFailed;

    if (!passed) {
      console.error('Immutability kata failed - triggers not working as expected');
    }

    return passed;

  } catch (error) {
    console.error('Immutability kata error:', error);
    return false;
  }
}
