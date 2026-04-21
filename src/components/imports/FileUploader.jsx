import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FileUploader({ onUploaded }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      alert('Please upload a CSV or Excel file.');
      return;
    }

    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const importRecord = await base44.entities.Import.create({
      file_name: file.name,
      file_url,
      file_type: ext === 'xls' ? 'xlsx' : ext,
      status: 'uploaded',
    });
    setUploading(false);
    onUploaded(importRecord);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <Card
      className={cn('border-2 border-dashed transition-colors', dragging ? 'border-primary bg-primary/5' : 'border-border')}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <CardContent className="flex flex-col items-center justify-center py-12">
        {uploading ? (
          <>
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
            <p className="text-sm font-medium">Uploading…</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-semibold mb-1">Drop a file here or click to upload</p>
            <p className="text-xs text-muted-foreground mb-4">CSV or Excel files (up to 25K rows)</p>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4" /> Choose File
            </Button>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => handleFile(e.target.files[0])} />
          </>
        )}
      </CardContent>
    </Card>
  );
}