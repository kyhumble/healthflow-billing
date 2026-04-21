import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import FileUploader from '@/components/imports/FileUploader';
import ColumnMapper from '@/components/imports/ColumnMapper';
import ImportProcessor from '@/components/imports/ImportProcessor';
import ValidationPreview from '@/components/imports/ValidationPreview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUS_COLORS = {
  uploaded: 'bg-blue-50 text-blue-700 border-blue-200',
  mapped: 'bg-purple-50 text-purple-700 border-purple-200',
  processing: 'bg-amber-50 text-amber-700 border-amber-200',
  processed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  partially_processed: 'bg-orange-50 text-orange-700 border-orange-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
};

export default function Imports() {
  const [activeImport, setActiveImport] = useState(null);
  const [step, setStep] = useState('upload'); // upload, map, validate, process
  const queryClient = useQueryClient();

  const { data: imports = [] } = useQuery({
    queryKey: ['imports'],
    queryFn: () => base44.entities.Import.list('-created_date', 50),
  });

  const handleUploaded = (record) => {
    setActiveImport(record);
    setStep('map');
    queryClient.invalidateQueries({ queryKey: ['imports'] });
  };

  const handleMapped = (record) => {
    setActiveImport(record);
    setStep('validate');
  };

  const handleValidated = () => {
    setStep('process');
  };

  const handleComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['imports'] });
    queryClient.invalidateQueries({ queryKey: ['claims'] });
    setActiveImport(null);
    setStep('upload');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Import Center" description="Upload and process billing spreadsheets" />

      {/* Active import wizard */}
      {step === 'upload' && <FileUploader onUploaded={handleUploaded} />}
      {step === 'map' && activeImport && <ColumnMapper importRecord={activeImport} onMapped={handleMapped} />}
      {step === 'validate' && activeImport && (
        <ValidationPreview
          importRecord={activeImport}
          onBack={() => setStep('map')}
          onValidated={handleValidated}
        />
      )}
      {step === 'process' && activeImport && <ImportProcessor importRecord={activeImport} onComplete={handleComplete} />}

      {/* Import history */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Import History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">File</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Rows</TableHead>
                <TableHead className="text-xs text-right">Processed</TableHead>
                <TableHead className="text-xs text-right">Errors</TableHead>
                <TableHead className="text-xs">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {imports.map(imp => (
                <TableRow key={imp.id} className="hover:bg-muted/30">
                  <TableCell className="text-sm font-medium">{imp.file_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('text-xs', STATUS_COLORS[imp.status])}>
                      {imp.status?.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-right font-tabular">{imp.row_count || 0}</TableCell>
                  <TableCell className="text-sm text-right font-tabular">{imp.processed_count || 0}</TableCell>
                  <TableCell className="text-sm text-right font-tabular">{imp.error_count || 0}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(imp.created_date), 'MMM d, yyyy')}
                  </TableCell>
                </TableRow>
              ))}
              {imports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                    No imports yet. Upload a file above to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}