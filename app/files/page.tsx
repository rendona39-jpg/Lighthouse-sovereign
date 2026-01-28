'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { CloudUpload, FileText, CheckCircle, Loader2, File, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useLighthouse } from '@/hooks/use-lighthouse';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TopBar } from '@/components/dashboard/top-bar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DEMO_UPLOADED_FILES } from '@/lib/demo-data';
import { cn } from '@/lib/utils';

interface UploadedFile {
  name: string;
  facts: number;
  date: string;
  status: string;
}

export default function FilesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { hasData, ingestFile } = useLighthouse({ orgId: user?.orgId });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(DEMO_UPLOADED_FILES);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const result = await ingestFile(file);
      if (result?.success) {
        setUploadedFiles(prev => [
          {
            name: file.name,
            facts: result.certified || 0,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            status: 'certified',
          },
          ...prev,
        ]);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  }, [ingestFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => {
      if (files[0]) {
        handleUpload(files[0]);
      }
    },
    accept: {
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    disabled: isUploading,
  });

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
              <h1 className="text-2xl font-semibold text-foreground">Files</h1>
              <p className="text-[13px] text-muted-foreground mt-1">Upload & manage documents</p>
            </div>

            {/* Upload Zone */}
            <Card className="mb-8">
              <CardContent className="p-8">
                <div
                  {...getRootProps()}
                  className={cn(
                    'w-full p-12 rounded-2xl border-2 border-dashed transition-all cursor-pointer',
                    isDragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/50',
                    isUploading && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  <input {...getInputProps()} />
                  
                  <div className="text-center">
                    {isUploading ? (
                      <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin mb-6" />
                    ) : (
                      <CloudUpload className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
                    )}

                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {isUploading ? 'Processing your data...' : 'Drop files here or click to browse'}
                    </h3>
                    
                    <p className="text-[15px] text-muted-foreground mb-4">
                      {isUploading
                        ? 'Certifying facts and building your knowledge base'
                        : 'CSV, PDF, Excel, or images'}
                    </p>

                    {!isUploading && (
                      <p className="text-[13px] text-muted-foreground">
                        Supported: Any POS export, invoices, bank statements
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Uploads */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Uploads</CardTitle>
                <CardDescription>Your uploaded documents and certified facts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {uploadedFiles.map((file, index) => (
                    <div 
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between p-4 bg-secondary rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-background rounded-lg">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-[15px] font-medium text-foreground">{file.name}</p>
                          <p className="text-[13px] text-success flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {file.facts} facts certified
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[13px] text-muted-foreground">{file.date}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
