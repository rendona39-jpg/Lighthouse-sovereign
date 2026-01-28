// app/api/query/route.ts
// Claude-powered conversational query interface with conversation state

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rateLimiter';
import { queryWithClaude } from '@/lib/errorRecovery';
import {
  getConversationContext,
  detectAmbiguity,
  buildEnhancedPrompt
} from '@/lib/conversationState';

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, message } = body;

    if (!userId || !message) {
      return NextResponse.json(
        { error: 'userId and message are required' },
        { status: 400 }
      );
    }

    // 1. Rate limit
    const rateCheck = await checkRateLimit(userId, 'query');
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: rateCheck.reason },
        { status: 429 }
      );
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

      return NextResponse.json({
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

    // 7. System prompt
    const systemPrompt = `You are Lighthouse, a conversational business physics engine.

Your mission: Answer questions using only certified atomic facts from the business spine.

## Core Principles

1. **Certified Mode (Default)**
   - Every statement must trace to certified facts with provenance
   - Use vector_type (POSITIVE/NEGATIVE), magnitude, temporal_anchor, category
   - Show confidence scores for all claims
   - If data is insufficient, say: "I need more data to answer that."

2. **Explore Mode (Triggered by 'what if', 'should I', 'hypothetical')**
   - Generate insights based on patterns but clearly label as exploratory
   - Use phrases like "Based on your pattern, one scenario is..."
   - Always return to certified facts when possible

3. **Conversational State**
   - Remember prior questions in this session
   - Use pronouns naturally ("You asked about X earlier...")
   - Detect ambiguous references ("Which period?" if unspecified)

4. **Response Structure**
   - Start with direct answer
   - Show reasoning steps with trace array
   - Cite specific fact_ids in provenance array
   - Suggest follow-up questions in actions array
   - Include chartData when visualizations help

## Available Data

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
    return NextResponse.json({
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
    return NextResponse.json(
      { error: 'Error processing question' },
      { status: 500 }
    );
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
