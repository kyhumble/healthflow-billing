import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle, Loader2, CloudUpload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFileExtension, validateImportFile } from '@/lib/importFileUtils';

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function FileUploader({ onUploaded }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef(null);

  const validate = (f) => {
    const result = validateImportFile(f);
    setError(result.error);
    return result.valid;
  };

  const selectFile = (f) => {
    if (!f) return;
    if (validate(f)) setFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    selectFile(e.dataTransfer.files[0]);
  };

  const clear = (e) => {
    e.stopPropagation();
    setFile(null);
    setError('');
    setDone(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const ext = getFileExtension(file.name);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const importRecord = await base44.entities.Import.create({
        file_name: file.name,
        file_url,
        file_type: ext === 'xls' ? 'xlsx' : ext,
        status: 'uploaded',
      });
      setDone(true);
      setTimeout(() => onUploaded(importRecord), 600);
    } catch (err) {
      setError(err?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const ext = getFileExtension(file?.name);
  const isExcel = ext === 'xlsx' || ext === 'xls';

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => !file && fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer select-none',
          file
            ? 'border-border cursor-default bg-muted/20'
            : dragging
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-border hover:border-primary/50 hover:bg-muted/30'
        )}
      >
        <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
          {!file ? (
            <>
              <div className={cn(
                'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors',
                dragging ? 'bg-primary/20' : 'bg-muted'
              )}>
                <CloudUpload className={cn('w-7 h-7 transition-colors', dragging ? 'text-primary' : 'text-muted-foreground')} />
              </div>
              <p className="text-sm font-semibold mb-1">
                {dragging ? 'Release to upload' : 'Drag & drop your file here'}
              </p>
              <p className="text-xs text-muted-foreground mb-4">CSV, XLSX, or XLS · up to 25,000 rows</p>
              <Button
                size="sm"
                variant="outline"
                className="gap-2 pointer-events-none"
              >
                <Upload className="w-3.5 h-3.5" /> Browse Files
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-4 w-full max-w-md">
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                isExcel ? 'bg-emerald-50' : 'bg-blue-50'
              )}>
                <FileSpreadsheet className={cn('w-6 h-6', isExcel ? 'text-emerald-600' : 'text-blue-600')} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatBytes(file.size)} · {ext?.toUpperCase()}</p>
                {done && (
                  <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Uploaded successfully
                  </p>
                )}
              </div>
              {!uploading && !done && (
                <button
                  onClick={clear}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
              {done && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
            </div>
          )}
        </div>

        {/* Progress overlay when uploading */}
        {uploading && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
              <p className="text-sm font-medium">Uploading {file?.name}…</p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Supported formats hint */}
      {!file && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />CSV</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />XLSX</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />XLS</span>
        </div>
      )}

      {/* Upload button */}
      {file && !uploading && !done && (
        <Button className="w-full gap-2" onClick={upload}>
          <Upload className="w-4 h-4" /> Upload & Continue
        </Button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={e => selectFile(e.target.files[0])}
      />
    </div>
  );
}
