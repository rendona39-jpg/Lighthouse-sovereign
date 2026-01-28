'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useLighthouse } from '@/hooks/use-lighthouse';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TopBar } from '@/components/dashboard/top-bar';
import { ChatArea } from '@/components/dashboard/chat-area';
import { NotesSidebar } from '@/components/dashboard/notes-sidebar';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  
  const {
    stats,
    hasData,
    messages,
    isLoading,
    isDemoMode,
    sendQuery,
    uploadFile,
    loadDemoConversation,
  } = useLighthouse({ orgId: user?.orgId });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar hasData={hasData} />
      
      <div className="ml-[60px] flex flex-col min-h-screen">
        <TopBar />
        
        <div className="flex-1 flex">
          {/* Main Content Area */}
          <main className="flex-1 flex flex-col">
            <ChatArea
              messages={messages}
              isLoading={isLoading}
              onSendMessage={sendQuery}
              hasData={hasData || isDemoMode}
              onLoadDemo={loadDemoConversation}
            />
          </main>

          {/* Right Sidebar - Notes */}
          <NotesSidebar userId={user?.orgId} />
        </div>
      </div>
    </div>
  );
}
