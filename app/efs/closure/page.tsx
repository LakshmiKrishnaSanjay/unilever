'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWorkflow } from '@/lib/use-workflow';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function EFSClosurePage() {
  const { ptws } = useWorkflow();
  const router = useRouter();

  // PTWs waiting for job closure review
  const pendingClosurePTWs = ptws.filter(
    (p) => p.status === 'WORK_COMPLETED' && p.requires_efs_review
  );

  const formatDateTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-semibold">Job Closure Reviews</h1>
            <p className="text-muted-foreground">Review completed work and approve job closures</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <CardTitle>
                Pending Closure Review ({pendingClosurePTWs.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {pendingClosurePTWs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No jobs pending closure review</p>
                <p className="text-sm text-muted-foreground">
                  Completed jobs will appear here for review
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permit ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Completed Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingClosurePTWs.map((ptw) => (
                    <TableRow key={ptw.id}>
                      <TableCell className="font-medium">{ptw.id}</TableCell>
                      <TableCell>{ptw.title}</TableCell>
                      <TableCell>{ptw.location}</TableCell>
                      <TableCell>
                        {ptw.work_completed_date
                          ? formatDateTime(ptw.work_completed_date)
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Work Completed</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" asChild>
                          <Link href={`/ptw/${ptw.id}`}>Review</Link>
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
    </DashboardLayout>
  );
}
