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
import { CheckCircle, Award, Eye } from 'lucide-react';
import { formatDateTime } from '@/lib/format';
import Link from 'next/link';

export default function MOCReviewPage() {
  const { mocs } = useWorkflow();

  const pendingMOCs = mocs.filter((moc) => moc.status === 'PENDING_HSE_FINAL');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">MOC Review Queue</h1>
          <p className="text-muted-foreground">
            Review MOCs awaiting final HSE approval
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pending MOCs ({pendingMOCs.length})</CardTitle>
              <Badge variant="secondary" className="gap-1">
                <Award className="h-3 w-3" />
                Final Authority
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            {pendingMOCs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No pending MOCs</p>
                <p className="text-sm text-muted-foreground">
                  No MOCs are awaiting final HSE approval
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>MOC ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {pendingMOCs.map((moc) => (
                    <TableRow key={moc.id}>
                      <TableCell className="font-medium">{moc.id}</TableCell>
                      <TableCell>{moc.title}</TableCell>
                      <TableCell>{moc.area}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {moc.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(moc.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" asChild>
                          <Link href={`/moc/${moc.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
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