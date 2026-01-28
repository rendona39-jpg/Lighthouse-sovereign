'use client';

import React from "react"
import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageBubble } from './message-bubble';
import type { Message } from '@/lib/types';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  hasData?: boolean;
  onLoadDemo?: () => void;
}

function BlinkingDots() {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <span className="text-4xl md:text-5xl text-muted-foreground font-light tracking-[0.3em]">
      {'.'.repeat(dotCount)}
    </span>
  );
}

export function ChatArea({ messages, isLoading, onSendMessage, hasData, onLoadDemo }: ChatAreaProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickAction = (query: string) => {
    // If no data, load demo conversation instead of calling API
    if (!hasData && onLoadDemo) {
      onLoadDemo();
      return;
    }
    onSendMessage(query);
  };

  return (
    <div className="flex-1 flex flex-col relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-[800px] mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4">
              <BlinkingDots />
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onSendQuery={handleQuickAction}
                />
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start mb-6">
                  <div className="bg-secondary rounded-2xl px-6 py-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-[13px]">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm border-t border-border px-8 py-4">
        <form onSubmit={handleSubmit} className="max-w-[800px] mx-auto">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Theta..."
              disabled={isLoading}
              className="min-h-[52px] max-h-[150px] resize-none pr-14 py-4 bg-secondary border-border rounded-xl text-[15px] placeholder:text-muted-foreground"
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-2 h-9 w-9 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
              <span className="sr-only">Send message</span>
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
}
