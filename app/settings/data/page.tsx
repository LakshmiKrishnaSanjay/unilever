'use client';

import React from "react"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { exportDb, importDb } from '@/src/demo/storage';
import { toast } from 'sonner';
import { Download, Upload, Copy, AlertCircle, CheckCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard-layout';

export default function DataImportExportPage() {
  const router = useRouter();
  const [exportedData, setExportedData] = useState('');
  const [importData, setImportData] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [copied, setCopied] = useState(false);

  // Load exported data on mount
  useEffect(() => {
    try {
      const data = exportDb();
      setExportedData(data);
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error('Failed to load current data');
    }
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportedData);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([exportedData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unilever-moc-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded successfully');
  };

  const validateImportData = () => {
    setValidationError('');
    
    if (!importData.trim()) {
      setValidationError('Please paste JSON data to import');
      return false;
    }

    try {
      const parsed = JSON.parse(importData);
      
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setValidationError('Invalid database format: must be an object');
        return false;
      }
      
      for (const key in parsed) {
        if (!Array.isArray(parsed[key])) {
          setValidationError(`Invalid table format: "${key}" must be an array`);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      if (error instanceof SyntaxError) {
        setValidationError('Invalid JSON format');
      } else {
        setValidationError('Validation failed: ' + (error as Error).message);
      }
      return false;
    }
  };

  const handleImportClick = () => {
    if (validateImportData()) {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmImport = () => {
    try {
      importDb(importData);
      setShowConfirmDialog(false);
      toast.success('Imported successfully');
      
      // Redirect to MOC list after successful import
      setTimeout(() => {
        router.push('/moc');
      }, 500);
    } catch (error) {
      setShowConfirmDialog(false);
      toast.error('Import failed: ' + (error as Error).message);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setImportData(text);
      setValidationError('');
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsText(file);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Data Import/Export</h1>
          <p className="text-muted-foreground mt-2">
            Export your data to move between accounts or backup, and import data from another account.
          </p>
        </div>

        <Tabs defaultValue="export" className="space-y-4">
          <TabsList>
            <TabsTrigger value="export">
              <Download className="mr-2 h-4 w-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export Database</CardTitle>
                <CardDescription>
                  Copy or download your complete database as JSON. Use this to backup your data or transfer it to another account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Textarea
                    value={exportedData}
                    readOnly
                    className="font-mono text-xs h-[400px]"
                    placeholder="Loading data..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCopy} variant="outline" className="bg-transparent">
                    {copied ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy to Clipboard
                      </>
                    )}
                  </Button>
                  <Button onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download JSON File
                  </Button>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This export includes all MOCs, PTWs, activities, notifications, and user profiles from your current session.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Import Database</CardTitle>
                <CardDescription>
                  Paste JSON data or upload a file to import. This will replace all existing data.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Upload JSON File
                  </label>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-muted-foreground
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary file:text-primary-foreground
                      hover:file:bg-primary/90
                      cursor-pointer"
                  />
                </div>

                <div className="relative">
                  <label className="text-sm font-medium mb-2 block">
                    Or Paste JSON Data
                  </label>
                  <Textarea
                    value={importData}
                    onChange={(e) => {
                      setImportData(e.target.value);
                      setValidationError('');
                    }}
                    className="font-mono text-xs h-[400px]"
                    placeholder='Paste your JSON data here, e.g.&#10;{&#10;  "moc": [...],&#10;  "ptw": [...],&#10;  ...&#10;}'
                  />
                </div>

                {validationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}

                <Alert className="border-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:border-amber-700">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-900 dark:text-amber-100">
                    <strong>Warning:</strong> Importing will replace all existing data. Make sure to export your current data first if you want to keep it.
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={handleImportClick} 
                  disabled={!importData.trim()}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Import Data
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Data Import</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace all existing data with the imported data. This action cannot be undone.
              Make sure you have exported your current data if you want to keep it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport}>
              Yes, Import Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
