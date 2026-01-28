'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Disable static generation for this page since it uses theme context with browser APIs
export const dynamic = 'force-dynamic';
import { Link2, Sun, Moon, Monitor, Bell, Clock, FileDown, Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useLighthouse } from '@/hooks/use-lighthouse';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TopBar } from '@/components/dashboard/top-bar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface Integration {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  apiKey?: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'toast',
    name: 'Toast POS',
    description: 'Sync daily sales, menu items, modifiers',
    connected: true,
    apiKey: '••••••••••••••••',
  },
  {
    id: 'r365',
    name: 'Restaurant365',
    description: 'Sync P&L, invoices, labor costs',
    connected: false,
  },
  {
    id: 'harri',
    name: 'Harri (HR & Scheduling)',
    description: 'Sync labor hours, payroll, scheduling',
    connected: false,
  },
  {
    id: 'sheets',
    name: 'Excel / Google Sheets',
    description: 'Import spreadsheets manually or via API',
    connected: false,
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();
  const { hasData } = useLighthouse({ orgId: user?.orgId });
  const [integrations, setIntegrations] = useState<Integration[]>(INTEGRATIONS);
  const [showApiKey, setShowApiKey] = useState<string | null>(null);
  const [notifications, setNotifications] = useState({ email: true, sms: false });
  const [dataRetention, setDataRetention] = useState('12');
  const [exportFormat, setExportFormat] = useState('csv');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleConnect = (integrationId: string) => {
    setIntegrations(prev => 
      prev.map(i => 
        i.id === integrationId 
          ? { ...i, connected: true, apiKey: '••••••••••••••••' }
          : i
      )
    );
  };

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
        
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
              <p className="text-[13px] text-muted-foreground mt-1">Integrations & preferences</p>
            </div>

            {/* API Integrations */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  API Integrations
                </CardTitle>
                <CardDescription>Connect your systems for automatic data sync</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {integrations.map((integration) => (
                  <div 
                    key={integration.id}
                    className="p-4 bg-secondary rounded-xl"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-background rounded-lg">
                            <Link2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-[15px] font-medium text-foreground">{integration.name}</p>
                            <p className="text-[13px] text-muted-foreground">{integration.description}</p>
                          </div>
                        </div>
                        
                        {integration.connected && integration.apiKey && (
                          <div className="mt-3 ml-11 flex items-center gap-2">
                            <span className="text-[13px] text-muted-foreground font-mono">
                              API Key: {showApiKey === integration.id ? 'sk_live_abc123xyz' : integration.apiKey}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2 text-[11px]"
                              onClick={() => setShowApiKey(showApiKey === integration.id ? null : integration.id)}
                            >
                              {showApiKey === integration.id ? (
                                <><EyeOff className="h-3 w-3 mr-1" /> Hide</>
                              ) : (
                                <><Eye className="h-3 w-3 mr-1" /> Show</>
                              )}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]">
                              Edit
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        {integration.connected ? (
                          <span className="text-[13px] text-success flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Connected
                          </span>
                        ) : (
                          <>
                            <span className="text-[13px] text-muted-foreground">Not connected</span>
                            <Button 
                              size="sm" 
                              onClick={() => handleConnect(integration.id)}
                            >
                              Connect
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[15px] font-medium text-foreground">Theme</p>
                    <p className="text-[13px] text-muted-foreground">Dark or light mode</p>
                  </div>
                  <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'h-8 px-3',
                        theme === 'dark' && 'bg-background'
                      )}
                      onClick={() => setTheme('dark')}
                    >
                      <Moon className="h-4 w-4 mr-1" />
                      Dark
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'h-8 px-3',
                        theme === 'light' && 'bg-background'
                      )}
                      onClick={() => setTheme('light')}
                    >
                      <Sun className="h-4 w-4 mr-1" />
                      Light
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'h-8 px-3',
                        theme === 'system' && 'bg-background'
                      )}
                      onClick={() => setTheme('system')}
                    >
                      <Monitor className="h-4 w-4 mr-1" />
                      System
                    </Button>
                  </div>
                </div>

                <div className="border-t border-border" />

                {/* Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[15px] font-medium text-foreground">Notifications</p>
                    <p className="text-[13px] text-muted-foreground">Email and SMS alerts</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <Switch 
                        checked={notifications.email} 
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email: checked }))}
                      />
                      <span className="text-[13px] text-muted-foreground">Email</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <Switch 
                        checked={notifications.sms} 
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, sms: checked }))}
                      />
                      <span className="text-[13px] text-muted-foreground">SMS</span>
                    </label>
                  </div>
                </div>

                <div className="border-t border-border" />

                {/* Data Retention */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[15px] font-medium text-foreground">Data Retention</p>
                    <p className="text-[13px] text-muted-foreground">How long to keep data</p>
                  </div>
                  <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg">
                    {['6', '12', '24', 'forever'].map((value) => (
                      <Button
                        key={value}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'h-8 px-3',
                          dataRetention === value && 'bg-background'
                        )}
                        onClick={() => setDataRetention(value)}
                      >
                        {value === 'forever' ? 'Forever' : `${value} months`}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border" />

                {/* Export Format */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[15px] font-medium text-foreground">Export Format</p>
                    <p className="text-[13px] text-muted-foreground">Default export format</p>
                  </div>
                  <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg">
                    {['csv', 'excel', 'pdf'].map((format) => (
                      <Button
                        key={format}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'h-8 px-3 uppercase',
                          exportFormat === format && 'bg-background'
                        )}
                        onClick={() => setExportFormat(format)}
                      >
                        {format}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
