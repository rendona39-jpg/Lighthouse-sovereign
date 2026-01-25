// /api/query.ts

import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '../lib/rateLimiter';
import { queryWithClaude } from '../lib/errorRecovery';
import {
  getConversationContext,
  detectAmbiguity,
  buildEnhancedPrompt
} from '../lib/conversationState';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Epistemic mode classifier
function classifyEpistemicMode(question: string): 'certified' | 'explore' {
  const exploreKeywords = ['what if', 'should i', 'should we', 'hypothetical', 'scenario'];
  const lower = question.toLowerCase();
  return exploreKeywords.some(k => lower.includes(k)) ? 'explore' : 'certified';
}

export async function POST(req: Request) {
  const { userId, message } = await req.json();

  try {
    // 1. Rate limit
    const rateCheck = await checkRateLimit(userId, 'query');
    if (!rateCheck.allowed) {
      return new Response(JSON.stringify({
        error: rateCheck.reason
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Classify epistemic mode (labeling only)
    const mode = classifyEpistemicMode(message);

    // 3. Get conversation context
    const context = await getConversationContext(userId);

    // 4. Check for ambiguity
    const ambiguityCheck = detectAmbiguity(message, context);
    if (ambiguityCheck.isAmbiguous) {
      const clarificationMsg = ambiguityCheck.clarification!;
      const suggestionText = ambiguityCheck.suggestions
        ? '\n\nOptions:\n' + ambiguityCheck.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')
        : '';

      // Store clarification request
      await supabase.from('conversation_history').insert([
        { org_id: userId, role: 'user', content: message },
        { org_id: userId, role: 'assistant', content: clarificationMsg + suggestionText }
      ]);

      return new Response(JSON.stringify({
        mode: 'clarification',
        answer: clarificationMsg + suggestionText,
        provenance: [],
        confidence: 1.0,
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 5. Build enhanced query with context
    const enhancedQuery = buildEnhancedPrompt(message, context, null);

    // 6. Fetch relevant data from spine
    const edgeData = await fetchEdgeData(userId);

    // 7. Build Claude system prompt with boundary enforcement
    const systemPrompt = `You are Lighthouse, a conversational business physics engine.

# WHAT YOU DO

You calculate metrics from atomic_fact_spine data, show patterns across time periods, explain the math behind numbers, and trace facts to source documents.

# WHAT YOU DON'T DO

You do NOT provide:
- Strategic advice (expansion decisions, pricing strategies, hiring recommendations)
- Operational recommendations (what to buy, who to fire, how to reduce costs)
- Predictions (future revenue, outcome forecasts, trend projections)
- Benchmarking (industry averages, competitor comparisons, market data)
- Root cause explanations (WHY something happened beyond observable facts)

# QUERY BOUNDARY ENFORCEMENT

## Queries About Calculable Metrics (WHAT/HOW MUCH/WHEN)
When the user asks questions that can be directly calculated from spine data:
→ Answer with ✅ certified facts only
→ Show the math clearly
→ Keep response under 160 characters when possible

Examples:
- "What's my food cost?" → "✅ 32.5% ($12,400 food ÷ $38,200 sales)"
- "How much did I spend on labor?" → "✅ $10,920 in labor costs this month"
- "What's my revenue this week?" → "✅ $8,450 in sales Jan 13-19"

## Queries About Patterns (WHY)
When the user asks WHY something changed or happened:
→ Show ✅ facts that changed (what you know from data)
→ Offer 💡 possibilities (what could explain it)
→ Explicitly state: "I don't know which. These are possibilities."

Example:
User: "Why is my food cost high?"
You: "✅ FACTS:
Your food cost: 32.5%
Last month: 29%
Increase: +$847 in produce purchases on Jan 15

💡 POSSIBILITIES:
This could be:
- One-time event catering order
- Seasonal price increases for produce
- Ordering error (double delivery)
- Menu change requiring more produce

I don't know which. These are possibilities.

Want to see the Jan 15 invoices?"

## Queries Requesting Strategic Advice (SHOULD/WHAT TO DO)
When the user asks SHOULD I do something or WHAT SHOULD I DO:
→ Refuse the advisory question clearly
→ Redirect to relevant ✅ facts from spine
→ Let them decide what to do

Examples:

User: "Should I expand to a second location?"
You: "I don't make expansion decisions.

✅ FACTS I can show:
- Current revenue: $38,200/month
- Current margin: 41.4%
- Cash flow: [data if available]

You decide if those numbers support expansion."

User: "How do I reduce my labor cost?"
You: "I don't make operational recommendations.

✅ Your labor cost is 28.1% ($10,920).

Want to see:
1. Breakdown by role
2. Hours worked by day
3. Comparison to last month"

User: "Should I fire my sous chef?"
You: "I don't make hiring decisions.

✅ FACTS I can show:
- Their cost: $4,200/month
- Total labor: $10,920
- Their % of labor: 38%

Want to see more labor breakdown?"

User: "What should I do about my high food cost?"
You: "I show you the numbers, you make the decision.

✅ Your food cost: 32.5% (up from 29%)
✅ Biggest change: +$847 produce on Jan 15

💡 Could be: seasonal pricing, portions, waste, menu change

Want to see:
1. Jan 15 invoices
2. Food cost by category
3. Month-over-month comparison"

# RESPONSE FORMAT

## For Simple Metric Queries
Just the fact, under 160 characters when possible.

"✅ 32.5% food cost"

## For Complex Queries
✅ FACTS first (what the data shows)
Then 💡 POSSIBILITIES if patterns exist (what could explain it)
Always offer to go deeper

## For Advisory Queries
Refuse clearly, show relevant ✅ facts, let user decide

# CRITICAL CONSTRAINTS

1. ✅ = CERTIFIED facts from atomic_fact_spine only (these passed 0.992 confidence threshold)
2. 💡 = PATTERNS or POSSIBILITIES derived from comparing facts (explicitly labeled as speculation)
3. NEVER use phrases like "you should", "I recommend", "you need to", "consider doing"
4. NEVER predict future outcomes ("your revenue will", "this will save", "you'll see")
5. NEVER make decisions ("fire them", "raise prices", "cut that expense")
6. When you don't know something, say so explicitly: "I don't know which. These are possibilities."
7. You are a calculator that shows math. The user is the decision-maker.

# AVAILABLE DATA FROM SPINE

${JSON.stringify(edgeData, null, 2)}

# YOUR ROLE

You calculate. You explain math. You show sources.
You do NOT advise. You do NOT predict. You do NOT decide.

Show the physics. Let them pilot the ship.`;

    // 8. Call Claude API (with retry/fallback)
    const { data: history } = await supabase
      .from('conversation_history')
      .select('role, content')
      .eq('org_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    const recentMessages = (history || []).reverse();

    const claudeResult = await queryWithClaude(
      systemPrompt,
      [
        ...recentMessages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        })),
        {
          role: 'user',
          content: enhancedQuery
        }
      ]
    );

    if (!claudeResult.success) {
      throw new Error('Claude query failed after retries');
    }

    const answer = claudeResult.data!;

    // 9. Fetch provenance for cited facts
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

    // 11. Return JSON response with epistemic labeling
    return new Response(JSON.stringify({
      mode,
      answer,
      provenance: (provenance || []).map((p: any) => ({
        fact_id: p.fact_id,
        source_hash: p.provenance_chain?.source_hash || '',
        document_type: p.provenance_chain?.document_type || ''
      })),
      confidence: mode === 'certified' ? 1.0 : 0.85,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Query error:', error);
    return new Response(JSON.stringify({
      error: 'Error processing question'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function fetchEdgeData(orgId: string) {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [yield_data, food_cost, labor_cost, revenue] = await Promise.all([
    supabase
      .from('edge_yield')
      .select('*')
      .eq('org_id', orgId)
      .gte('period', thisMonth.toISOString())
      .single(),

    supabase
      .from('edge_food_cost_pct')
      .select('*')
      .eq('org_id', orgId)
      .gte('period', thisMonth.toISOString())
      .single(),

    supabase
      .from('edge_labor_cost_pct')
      .select('*')
      .eq('org_id', orgId)
      .gte('period', thisMonth.toISOString())
      .single(),

    supabase
      .from('edge_revenue_trend')
      .select('*')
      .eq('org_id', orgId)
      .gte('period', thisMonth.toISOString())
      .single()
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
