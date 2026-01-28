// /lib/rateLimiter.ts

import { createClient } from '@supabase/supabase-js';

// Lazy client initialization to avoid build-time env var evaluation
function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) return null;
  
  return createClient(url, key);
}

// Rate limit tiers
const LIMITS = {
  UPLOADS_PER_DAY: 100,
  FILES_PER_HOUR: 50,
  MAX_FILE_SIZE: 10_000_000, // 10MB
  QUERY_PER_MINUTE: 10
};

interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  resetAt?: Date;
  current?: number;
  limit?: number;
}

export async function checkRateLimit(
  userId: string,
  type: 'upload' | 'query'
): Promise<RateLimitResult> {
  const supabase = getSupabaseClient();
  if (!supabase) return { allowed: true }; // Allow if no Supabase configured
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
  const thisMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());

  // Check upload limits (hourly and daily)
  if (type === 'upload') {
    // Hourly check
    const { count: hourlyCount } = await supabase
      .from('provenance_chain')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', userId)
      .eq('source_type', 'WEB_UPLOAD')
      .gte('ingest_timestamp', thisHour.toISOString());

    if (hourlyCount && hourlyCount >= LIMITS.FILES_PER_HOUR) {
      return {
        allowed: false,
        reason: 'Hourly upload limit reached (50/hour). Please wait.',
        resetAt: new Date(thisHour.getTime() + 60 * 60 * 1000),
        current: hourlyCount,
        limit: LIMITS.FILES_PER_HOUR
      };
    }

    // Daily check
    const { count: dailyCount } = await supabase
      .from('provenance_chain')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', userId)
      .eq('source_type', 'WEB_UPLOAD')
      .gte('ingest_timestamp', today.toISOString());

    if (dailyCount && dailyCount >= LIMITS.UPLOADS_PER_DAY) {
      return {
        allowed: false,
        reason: 'Daily upload limit reached (100/day). Resets at midnight.',
        resetAt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        current: dailyCount,
        limit: LIMITS.UPLOADS_PER_DAY
      };
    }
  }

  // Check query per minute
  if (type === 'query') {
    const { count } = await supabase
      .from('conversation_history')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', userId)
      .eq('role', 'user')
      .gte('created_at', thisMinute.toISOString());

    if (count && count >= LIMITS.QUERY_PER_MINUTE) {
      return {
        allowed: false,
        reason: 'Too many questions too fast. Wait a moment.',
        resetAt: new Date(thisMinute.getTime() + 60 * 1000),
        current: count,
        limit: LIMITS.QUERY_PER_MINUTE
      };
    }
  }

  return { allowed: true };
}

export async function validateFileSize(fileBuffer: ArrayBuffer): Promise<{
  valid: boolean;
  reason?: string;
  size?: number;
}> {
  const size = fileBuffer.byteLength;

  if (size > LIMITS.MAX_FILE_SIZE) {
    return {
      valid: false,
      reason: `File too large (${(size / 1_000_000).toFixed(1)}MB). Max 10MB.`,
      size
    };
  }

  if (size < 64) {
    return {
      valid: false,
      reason: 'File too small. Probably corrupted.',
      size
    };
  }

  return { valid: true, size };
}

export async function detectSpam(orgId: string): Promise<{
  isSpam: boolean;
  reason?: string;
}> {
  const supabase = getSupabaseClient();
  if (!supabase) return { isSpam: false }; // Allow if no Supabase configured
  
  // Check for identical messages in short time
  const { data: recentMessages } = await supabase
    .from('conversation_history')
    .select('content, created_at')
    .eq('org_id', orgId)
    .eq('role', 'user')
    .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(10);

  if (recentMessages && recentMessages.length >= 5) {
    const uniqueMessages = new Set(recentMessages.map(m => m.content.toLowerCase().trim()));

    // If they sent 5+ messages but only 1-2 unique ones, likely spam
    if (uniqueMessages.size <= 2) {
      return {
        isSpam: true,
        reason: 'Repeated identical messages detected'
      };
    }
  }

  return { isSpam: false };
}

export async function quarantineSuspiciousActivity(
  userId: string,
  reason: string,
  metadata: any
) {
  const supabase = getSupabaseClient();
  if (!supabase) return; // Skip if no Supabase configured
  
  await supabase.from('security_alerts').insert({
    org_id: userId,
    alert_type: 'SUSPICIOUS_ACTIVITY',
    reason,
    metadata,
    created_at: new Date().toISOString()
  });

  // Log critical alerts
  if (reason.includes('spam') || reason.includes('abuse')) {
    console.error(`🚨 SECURITY ALERT - User: ${userId} - Reason: ${reason}`);
  }
}
