'use client';

import React from "react"

import { FileText, Pin, Search, BarChart3, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChartArtifact } from './chart-artifact';
import type { Message } from '@/lib/types';

interface MessageBubbleProps {
  message: Message;
  onSendQuery?: (query: string) => void;
  onPin?: (message: Message) => void;
}

function getIcon(step: string) {
  const icons: Record<string, React.ReactNode> = {
    analyzing: <Search className="h-3 w-3" />,
    fetching: <BarChart3 className="h-3 w-3" />,
    computing: <BarChart3 className="h-3 w-3" />,
    generating: <Sparkles className="h-3 w-3" />,
  };
  return icons[step] || <span className="h-3 w-3">•</span>;
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function MessageBubble({ message, onSendQuery, onPin }: MessageBubbleProps) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-6">
        <div className="bg-primary text-primary-foreground rounded-2xl px-4 py-3 max-w-[80%]">
          <p className="text-[15px] whitespace-pre-wrap">{message.content}</p>
          <span className="text-[11px] opacity-70 mt-1 block">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6">
      <div className="bg-secondary rounded-2xl p-6 max-w-[90%]">
        {/* Reasoning Trace */}
        {message.reasoning?.trace && message.reasoning.trace.length > 0 && (
          <div className="mb-4 space-y-2">
            {message.reasoning.trace.map((step, i) => (
              <div
                key={`${step.step}-${i}`}
                className="flex items-center gap-2 text-[13px] text-muted-foreground animate-fadeIn"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {getIcon(step.step)}
                <span>{step.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Main Answer */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="text-[15px] text-foreground whitespace-pre-wrap leading-relaxed">
            {message.content}
          </div>
        </div>

        {/* Epistemic Mode Badge */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {message.mode === 'certified' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-success/10 text-success px-2 py-1 rounded-full">
              Certified
            </span>
          )}
          {message.mode === 'explore' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-explore/10 text-explore px-2 py-1 rounded-full">
              Explore Mode
            </span>
          )}
          {message.mode === 'clarification' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-info/10 text-info px-2 py-1 rounded-full">
              Need More Info
            </span>
          )}

          {/* Pin Button */}
          {onPin && (
            <button
              onClick={() => onPin(message)}
              className="ml-auto text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <Pin className="h-3 w-3" />
              Pin
            </button>
          )}
        </div>

        {/* Inline Chart */}
        {message.chartData && (
          <div className="mt-6">
            <ChartArtifact data={message.chartData} />
          </div>
        )}

        {/* Provenance */}
        {message.provenance && message.provenance.length > 0 && (
          <details className="mt-4 group">
            <summary className="text-[13px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors list-none flex items-center gap-1">
              <span className="group-open:rotate-90 transition-transform">▸</span>
              View sources ({message.provenance.length} facts)
            </summary>
            <div className="mt-2 space-y-1 pl-4">
              {message.provenance.map((source, i) => (
                <div
                  key={`${source.fact_id}-${i}`}
                  className="text-[12px] text-muted-foreground flex items-center gap-2"
                >
                  <FileText className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{source.source}</span>
                  <span className="font-mono text-[11px] ml-auto">
                    {(source.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Quick Actions */}
        {message.actions && message.actions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {message.actions.map((action, i) => (
              <button
                key={`${action.query}-${i}`}
                onClick={() => onSendQuery?.(action.query)}
                className="text-[13px] px-3 py-1.5 border border-border rounded-lg hover:bg-hover transition-colors text-foreground"
              >
                {action.text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
