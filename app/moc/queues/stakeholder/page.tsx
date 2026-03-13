'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWorkflow } from '@/lib/use-workflow';
import Link from 'next/link';
import { Clock, FileText } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/format';

export default function StakeholderMOCQueuePage() {
  const { mocs = [], currentUser } = useWorkflow();

  const pendingMOCs = mocs.filter(
    (m) =>
      m.status === 'PENDING_STAKEHOLDER_REVIEW' &&
      m.stakeholders?.some((s) => s.stakeholder_role === currentUser?.role && s.status === 'PENDING')
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Stakeholder MOC Review Queue</h1>
          <p className="text-muted-foreground">MOCs pending your sign-off</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pending Sign-offs</CardTitle>
              <Badge variant="outline">{pendingMOCs.length} items</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {pendingMOCs.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">No MOCs pending your sign-off</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>MOC ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Contractor</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingMOCs.map((moc) => (
                    <TableRow key={moc.id}>
                      <TableCell className="font-medium">{moc.id}</TableCell>
                      <TableCell>{moc.title}</TableCell>
                      <TableCell>{moc.contractor_id}</TableCell>
                      <TableCell>
                        <Badge variant={moc.priority === 'CRITICAL' ? 'destructive' : 'outline'}>{moc.priority}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(moc.startDate)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/moc/${moc.id}`}>
                            <FileText className="mr-2 h-4 w-4" />
                            Review
                          </Link>
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
