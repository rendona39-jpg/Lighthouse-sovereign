'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudUpload, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  onUpload: (file: File) => Promise<void>;
}

export function EmptyState({ onUpload }: EmptyStateProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      await onUpload(file);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => {
      if (files[0]) {
        handleUpload(files[0]);
      }
    },
    accept: {
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: isUploading,
  });

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div
        {...getRootProps()}
        className={cn(
          'w-full max-w-md p-12 rounded-2xl border-2 border-dashed transition-all cursor-pointer',
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
            {isUploading ? 'Processing your data...' : 'Upload your first document'}
          </h3>
          
          <p className="text-[15px] text-muted-foreground mb-6">
            {isUploading
              ? 'Certifying facts and building your knowledge base'
              : 'to unlock AI-powered insights'}
          </p>

          {!isUploading && (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg text-[13px] text-muted-foreground">
                <FileText className="h-4 w-4" />
                Drop files or click to browse
              </div>

              <p className="mt-4 text-[11px] uppercase tracking-wide text-muted-foreground">
                Supports: CSV, PDF, Images (max 10MB)
              </p>
            </>
          )}

          {uploadError && (
            <p className="mt-4 text-[13px] text-destructive">{uploadError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
