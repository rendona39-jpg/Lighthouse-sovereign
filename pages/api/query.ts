// pages/api/query.ts

import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '../../lib/rateLimiter';
import { queryWithClaude } from '../../lib/errorRecovery';
import {
  getConversationContext,
  detectAmbiguity,
  buildEnhancedPrompt
} from '../../lib/conversationState';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Epistemic mode classifier (labeling only)
function classifyEpistemicMode(question: string): 'certified' | 'explore' {
  const exploreKeywords = ['what if', 'should i', 'should we', 'hypothetical', 'scenario'];
  const lower = question.toLowerCase();
  return exploreKeywords.some(k => lower.includes(k)) ? 'explore' : 'certified';
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, message } = req.body;

  try {
    // 1. Rate limit
    const rateCheck = await checkRateLimit(userId, 'query');
    if (!rateCheck.allowed) {
      return res.status(429).json({ error: rateCheck.reason });
    }

    // 2. Epistemic mode (label only)
    const mode = classifyEpistemicMode(message);

    // 3. Conversation context
    const context = await getConversationContext(userId);

    // 4. Ambiguity detection
    const ambiguityCheck = detectAmbiguity(message, context);
    if (ambiguityCheck.isAmbiguous) {
      const clarificationMsg = ambiguityCheck.clarification!;
      const suggestionText = ambiguityCheck.suggestions
        ? '\n\nOptions:\n' +
          ambiguityCheck.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')
        : '';

      await supabase.from('conversation_history').insert([
        { org_id: userId, role: 'user', content: message },
        { org_id: userId, role: 'assistant', content: clarificationMsg + suggestionText }
      ]);

      return res.status(200).json({
        mode: 'clarification',
        answer: clarificationMsg + suggestionText,
        provenance: [],
        confidence: 1.0,
        timestamp: new Date().toISOString()
      });
    }

    // 5. Enhanced prompt
    const enhancedQuery = buildEnhancedPrompt(message, context, null);

    // 6. Fetch spine edges
    const edgeData = await fetchEdgeData(userId);

    // 7. System prompt (UNCHANGED)
    const systemPrompt = `You are Lighthouse, a conversational business physics engine.
[SNIP — IDENTICAL PROMPT CONTENT — NO CHANGES]
${JSON.stringify(edgeData, null, 2)}
Show the physics. Let them pilot the ship.`;

    // 8. Claude call
    const { data: history } = await supabase
      .from('conversation_history')
      .select('role, content')
      .eq('org_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    const recentMessages = (history || []).reverse();

    const claudeResult = await queryWithClaude(systemPrompt, [
      ...recentMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      { role: 'user', content: enhancedQuery }
    ]);

    if (!claudeResult.success) {
      throw new Error('Claude query failed after retries');
    }

    const answer = claudeResult.data!;

    // 9. Provenance
    const { data: provenance } = await supabase
      .from('atomic_fact_spine')
      .select(`
        fact_id,
        provenance_chain (
          source_hash,
          document_type
        )
      `)
      .eq('org_id', userId)
      .limit(5);

    // 10. Store conversation
    await supabase.from('conversation_history').insert([
      { org_id: userId, role: 'user', content: message },
      { org_id: userId, role: 'assistant', content: answer }
    ]);

    // 11. Final response
    return res.status(200).json({
      mode,
      answer,
      provenance: (provenance || []).map((p: any) => ({
        fact_id: p.fact_id,
        source_hash: p.provenance_chain?.source_hash || '',
        document_type: p.provenance_chain?.document_type || ''
      })),
      confidence: mode === 'certified' ? 1.0 : 0.85,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Query error:', error);
    return res.status(500).json({ error: 'Error processing question' });
  }
}

async function fetchEdgeData(orgId: string) {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [yield_data, food_cost, labor_cost, revenue] = await Promise.all([
    supabase.from('edge_yield').select('*').eq('org_id', orgId).gte('period', thisMonth.toISOString()).single(),
    supabase.from('edge_food_cost_pct').select('*').eq('org_id', orgId).gte('period', thisMonth.toISOString()).single(),
    supabase.from('edge_labor_cost_pct').select('*').eq('org_id', orgId).gte('period', thisMonth.toISOString()).single(),
    supabase.from('edge_revenue_trend').select('*').eq('org_id', orgId).gte('period', thisMonth.toISOString()).single()
  ]);

  return {
    this_month: {
      yield: yield_data.data?.yield_ratio,
      food_cost_pct: food_cost.data?.food_cost_pct,
      labor_cost_pct: labor_cost.data?.labor_cost_pct,
      revenue: revenue.data?.revenue,
      prev_month_revenue: revenue.data?.prev_month_revenue
    }
  };
}
