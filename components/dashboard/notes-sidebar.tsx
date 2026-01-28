'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pin, X, BarChart3, FileText, PanelRightClose, PanelRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { PinnedItem } from '@/lib/types';

interface NotesSidebarProps {
  userId?: string;
}

export function NotesSidebar({ userId }: NotesSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [notes, setNotes] = useState('');
  const [pinnedItems, setPinnedItems] = useState<PinnedItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load notes on mount
  useEffect(() => {
    if (!userId) return;
    
    const loadNotes = async () => {
      try {
        const response = await fetch(`/api/notes?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setNotes(data.content || '');
          if (data.updatedAt) {
            setLastSaved(new Date(data.updatedAt));
          }
        }
      } catch {
        // Notes not found, start fresh
      }
    };

    loadNotes();

    // Load pinned items from localStorage
    const storedPins = localStorage.getItem(`lighthouse_pins_${userId}`);
    if (storedPins) {
      try {
        setPinnedItems(JSON.parse(storedPins));
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, [userId]);

  // Auto-save notes with debounce
  const saveNotes = useCallback(async (content: string) => {
    if (!userId) return;
    
    setIsSaving(true);
    try {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, content }),
      });
      setLastSaved(new Date());
    } catch {
      // Save failed silently
    } finally {
      setIsSaving(false);
    }
  }, [userId]);

  // Debounced save effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (notes && userId) {
        saveNotes(notes);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [notes, userId, saveNotes]);

  // Save pinned items to localStorage
  useEffect(() => {
    if (userId && pinnedItems.length > 0) {
      localStorage.setItem(`lighthouse_pins_${userId}`, JSON.stringify(pinnedItems));
    }
  }, [pinnedItems, userId]);

  const removePin = (id: string) => {
    setPinnedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const formatLastSaved = () => {
    if (!lastSaved) return null;
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(lastSaved);
  };

  if (isCollapsed) {
    return (
      <div className="w-12 border-l border-border bg-secondary flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <PanelRight className="h-4 w-4" />
          <span className="sr-only">Expand sidebar</span>
        </Button>
      </div>
    );
  }

  return (
    <aside className="w-[320px] border-l border-border bg-secondary flex flex-col hidden lg:flex">
      {/* Header */}
      <div className="h-[60px] flex items-center justify-between px-4 border-b border-border">
        <h2 className="text-[15px] font-medium text-foreground">Notes</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add note</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(true)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <PanelRightClose className="h-4 w-4" />
            <span className="sr-only">Collapse sidebar</span>
          </Button>
        </div>
      </div>

      {/* Notes Section */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 flex-shrink-0">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Write your notes here..."
            className="min-h-[150px] resize-none bg-background border-border text-[13px]"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-muted-foreground">
              {isSaving ? 'Saving...' : lastSaved ? `Last saved ${formatLastSaved()}` : 'Auto-saves'}
            </span>
          </div>
        </div>

        {/* Pinned Items Section */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2 flex items-center justify-between border-t border-border">
            <div className="flex items-center gap-2">
              <Pin className="h-4 w-4 text-muted-foreground" />
              <span className="text-[13px] font-medium text-foreground">Pinned Items</span>
            </div>
            <span className="text-[11px] text-muted-foreground">{pinnedItems.length}</span>
          </div>

          {pinnedItems.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] text-muted-foreground">
                No pinned items yet
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Pin insights from chat to save them here
              </p>
            </div>
          ) : (
            <div className="space-y-2 px-4 pb-4">
              {pinnedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-background border border-border rounded-lg p-3 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {item.type === 'chart' ? (
                        <BarChart3 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="text-[13px] font-medium text-foreground truncate">
                        {item.title}
                      </span>
                    </div>
                    <button
                      onClick={() => removePin(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove pin</span>
                    </button>
                  </div>
                  {item.preview && (
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                      {item.preview}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
