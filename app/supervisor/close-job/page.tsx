'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWorkflow, useWorkflowActions } from '@/lib/use-workflow';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { CheckCircle, FileCheck } from 'lucide-react';
import type { PTW } from '@/lib/types';

function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function CloseJobPage() {
  const { ptws } = useWorkflow();
  const workflowActions = useWorkflowActions();
  const [selectedPTW, setSelectedPTW] = useState<PTW | null>(null);
  const [finalNotes, setFinalNotes] = useState('');
  const [checklistItems, setChecklistItems] = useState({
    work_completed: false,
    area_cleaned: false,
    tools_removed: false,
    safety_verified: false,
    documentation_complete: false,
  });

  const completedPTWs = ptws.filter((p) => p.status === 'WORK_COMPLETED');

  const handleCloseJob = () => {
    if (!selectedPTW) return;

    const allChecked = Object.values(checklistItems).every((v) => v);
    if (!allChecked) {
      toast.error('Please complete all checklist items');
      return;
    }

    if (!finalNotes.trim()) {
      toast.error('Please provide closure notes');
      return;
    }

    const result = workflowActions.completeSupervisorClosure(selectedPTW.id, finalNotes);
    if (result.success) {
      toast.success('Closure checklist completed - Sent to Facilities for review');
      setSelectedPTW(null);
      setFinalNotes('');
      setChecklistItems({
        work_completed: false,
        area_cleaned: false,
        tools_removed: false,
        safety_verified: false,
        documentation_complete: false,
      });
    } else {
      toast.error(result.error || 'Failed to complete closure checklist');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Job Closure</h1>
          <p className="text-muted-foreground">
            Review and close completed work permits
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              <CardTitle>Pending Closure ({completedPTWs.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {completedPTWs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No jobs pending closure</p>
                <p className="text-sm text-muted-foreground">All completed work has been closed</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permit ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Completed On</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedPTWs.map((ptw) => (
                    <TableRow key={ptw.id}>
                      <TableCell className="font-medium">{ptw.id}</TableCell>
                      <TableCell>{ptw.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ptw.permit_type.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>{ptw.location}</TableCell>
                      <TableCell>
                        {ptw.work_completed_date
                          ? formatDateTime(ptw.work_completed_date)
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => setSelectedPTW(ptw)}>
                          <FileCheck className="mr-1 h-4 w-4" />
                          Complete Checklist
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedPTW} onOpenChange={() => setSelectedPTW(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Supervisor Closure Checklist</DialogTitle>
            <DialogDescription>
              Complete the closure checklist - Facilities and HSE will review before final closure
            </DialogDescription>
          </DialogHeader>
          {selectedPTW && (
            <div className="space-y-6">
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-medium">{selectedPTW.title}</h4>
                <p className="text-sm text-muted-foreground">ID: {selectedPTW.id}</p>
                <p className="text-sm text-muted-foreground">Location: {selectedPTW.location}</p>
              </div>

              <div className="space-y-4">
                <Label className="text-base">Closure Checklist</Label>
                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="work_completed"
                      checked={checklistItems.work_completed}
                      onCheckedChange={(checked) =>
                        setChecklistItems({
                          ...checklistItems,
                          work_completed: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="work_completed" className="font-normal">
                      All work activities have been completed as specified
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="area_cleaned"
                      checked={checklistItems.area_cleaned}
                      onCheckedChange={(checked) =>
                        setChecklistItems({
                          ...checklistItems,
                          area_cleaned: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="area_cleaned" className="font-normal">
                      Work area has been cleaned and cleared of debris
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="tools_removed"
                      checked={checklistItems.tools_removed}
                      onCheckedChange={(checked) =>
                        setChecklistItems({
                          ...checklistItems,
                          tools_removed: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="tools_removed" className="font-normal">
                      All tools and equipment have been removed from site
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="safety_verified"
                      checked={checklistItems.safety_verified}
                      onCheckedChange={(checked) =>
                        setChecklistItems({
                          ...checklistItems,
                          safety_verified: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="safety_verified" className="font-normal">
                      Safety hazards have been eliminated or controlled
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="documentation_complete"
                      checked={checklistItems.documentation_complete}
                      onCheckedChange={(checked) =>
                        setChecklistItems({
                          ...checklistItems,
                          documentation_complete: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="documentation_complete" className="font-normal">
                      All required documentation is complete and accurate
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Final Closure Notes *</Label>
                <Textarea
                  placeholder="Provide summary of work completed, any observations, and handover notes..."
                  value={finalNotes}
                  onChange={(e) => setFinalNotes(e.target.value)}
                  rows={5}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPTW(null)}>
              Cancel
            </Button>
            <Button onClick={handleCloseJob}>Submit for Facilities Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
