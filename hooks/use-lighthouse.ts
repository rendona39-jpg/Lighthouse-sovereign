'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import type { LighthouseStats, Message, IngestResponse } from '@/lib/types';
import { DEMO_MESSAGES, DEMO_STATS } from '@/lib/demo-data';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

interface UseLighthouseOptions {
  orgId: string | undefined;
}

export function useLighthouse({ orgId }: UseLighthouseOptions) {
  const { data: stats, error, mutate } = useSWR<LighthouseStats>(
    orgId ? `/api/stats?org_id=${orgId}` : null,
    fetcher,
    { refreshInterval: 300000 } // 5 minutes
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const hasData = stats?.efficiency?.factDensity ? stats.efficiency.factDensity > 0 : false;

  // Load demo conversation (no API calls)
  const loadDemoConversation = useCallback(() => {
    setIsDemoMode(true);
    setMessages(DEMO_MESSAGES);
  }, []);

  const sendQuery = useCallback(async (message: string) => {
    if (!orgId) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: orgId,
          message,
          conversationHistory: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Query failed');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(),
        mode: data.mode,
        reasoning: data.reasoning,
        chartData: data.chartData,
        provenance: data.provenance,
        actions: data.actions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Query failed:', err);
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        mode: 'clarification',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, messages]);

  const uploadFile = useCallback(async (file: File): Promise<IngestResponse> => {
    if (!orgId) {
      throw new Error('No organization ID');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', orgId);

    const response = await fetch('/api/ingest', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const result: IngestResponse = await response.json();

    // Refresh stats after upload
    mutate();

    // Add system message about upload
    const uploadMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: result.message,
      timestamp: new Date(),
      mode: 'certified',
    };
    setMessages((prev) => [...prev, uploadMessage]);

    return result;
  }, [orgId, mutate]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // For demo mode, use demo stats
  const effectiveStats = isDemoMode ? DEMO_STATS : stats;
  const effectiveHasData = isDemoMode ? true : hasData;

  return {
    stats: effectiveStats,
    error,
    hasData: effectiveHasData,
    messages,
    isLoading,
    isDemoMode,
    sendQuery,
    uploadFile,
    clearMessages,
    loadDemoConversation,
    refreshStats: mutate,
    ingestFile: uploadFile,
  };
}
