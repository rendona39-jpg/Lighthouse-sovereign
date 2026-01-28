// /lib/conversationState.ts

import { createClient } from '@supabase/supabase-js';

// Lazy client initialization to avoid build-time env var evaluation
function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) return null;
  
  return createClient(url, key);
}

interface ConversationContext {
  lastQuery: string;
  lastResponse: string;
  referencedPeriod?: string;
  referencedCategory?: string;
  pendingClarification?: {
    question: string;
    options: string[];
  };
}

export async function getConversationContext(orgId: string): Promise<ConversationContext | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  
  const { data } = await supabase
    .from('conversation_history')
    .select('role, content, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!data || data.length === 0) return null;

  const lastUserMessage = data.find(m => m.role === 'user');
  const lastAssistantMessage = data.find(m => m.role === 'assistant');

  return {
    lastQuery: lastUserMessage?.content || '',
    lastResponse: lastAssistantMessage?.content || '',
    referencedPeriod: extractPeriod(data),
    referencedCategory: extractCategory(data)
  };
}

function extractPeriod(messages: any[]): string | undefined {
  const recent = messages.slice(0, 3).map(m => m.content).join(' ');

  if (recent.includes('this month') || recent.includes('current')) {
    return 'current_month';
  }
  if (recent.includes('last month')) {
    return 'last_month';
  }

  const dateMatch = recent.match(/\d{4}-\d{2}-\d{2}/);
  if (dateMatch) {
    return dateMatch[0];
  }

  return undefined;
}

function extractCategory(messages: any[]): string | undefined {
  const recent = messages.slice(0, 3).map(m => m.content).join(' ');

  const categories = ['food', 'labor', 'supplies', 'utilities', 'rent'];
  return categories.find(cat => recent.toLowerCase().includes(cat));
}

export function detectAmbiguity(query: string, context: ConversationContext | null): {
  isAmbiguous: boolean;
  clarification?: string;
  suggestions?: string[];
} {
  const lower = query.toLowerCase().trim();

  // Time ambiguity
  if (
    (lower === 'food cost' || lower === 'labor cost' || lower === 'revenue') &&
    !context?.referencedPeriod
  ) {
    return {
      isAmbiguous: true,
      clarification: 'Which time period?',
      suggestions: ['This month', 'Last month', 'Today', 'This week']
    };
  }

  // Vague pronouns without context
  if (
    (lower.includes('it') || lower.includes('that') || lower.includes('those')) &&
    !context?.lastQuery
  ) {
    return {
      isAmbiguous: true,
      clarification: "What are you referring to? (I don't have context from earlier)"
    };
  }

  // "Why" without prior fact
  if (
    lower.startsWith('why') &&
    (!context?.lastResponse || !context.lastResponse.includes('✅'))
  ) {
    return {
      isAmbiguous: true,
      clarification: "Why what specifically? Ask me for a number first, then I can explain it."
    };
  }

  return { isAmbiguous: false };
}

export function buildEnhancedPrompt(
  query: string,
  context: ConversationContext | null,
  edgeData: any
): string {
  let prompt = query;

  // Add implicit time context
  if (context?.referencedPeriod && !query.match(/this|last|month|week/)) {
    const period = context.referencedPeriod === 'current_month'
      ? 'this month'
      : context.referencedPeriod === 'last_month'
      ? 'last month'
      : `for ${context.referencedPeriod}`;

    prompt = `${query} (${period})`;
  }

  // Add category context if relevant
  if (context?.referencedCategory && query.length < 15) {
    prompt = `${query} for ${context.referencedCategory}`;
  }

  return prompt;
}
