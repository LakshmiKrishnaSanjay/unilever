'use client';

import { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWorkflow } from '@/lib/use-workflow';
import Link from 'next/link';
import { FileText, Pencil, Search } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'secondary',
};

export default function DraftPermitsPage() {
  const { ptws = [], currentUser } = useWorkflow();
  const [search, setSearch] = useState('');

  const isContractor =
    currentUser?.role === 'contractor_admin' ||
    currentUser?.role === 'contractor_supervisor';

  const currentContractorId =
    (currentUser as any)?.contractor_id ??
    (currentUser as any)?.contractorId ??
    null;

  const displayDrafts = useMemo(() => {
    let drafts = (ptws ?? []).filter((p) => p.status === 'DRAFT');

    if (isContractor && currentContractorId) {
      drafts = drafts.filter((p) => p.contractor_id === currentContractorId);
    }

    return drafts;
  }, [ptws, isContractor, currentContractorId]);

  const filteredDrafts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return displayDrafts;

    return displayDrafts.filter((ptw) => {
      const id = (ptw.id ?? '').toLowerCase();
      const title = (ptw.title ?? '').toLowerCase();
      const location = (ptw.location ?? '').toLowerCase();
      const permitType = (ptw.permit_type ?? '').toLowerCase();

      return (
        id.includes(q) ||
        title.includes(q) ||
        location.includes(q) ||
        permitType.includes(q)
      );
    });
  }, [displayDrafts, search]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Draft Permits</h1>
            <p className="text-muted-foreground">
              {isContractor ? 'View and edit your saved drafts' : 'View all draft permits'}
            </p>
          </div>

          <Button variant="outline" asChild>
            <Link href="/permits">
              <FileText className="mr-2 h-4 w-4" />
              All Permits
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search draft permits..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Permit ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rev</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredDrafts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No draft permits found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDrafts.map((ptw) => (
                    <TableRow key={ptw.id}>
                      <TableCell className="font-medium">{ptw.id}</TableCell>
                      <TableCell>{ptw.title || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {(ptw.permit_type ?? '').replace(/_/g, ' ') || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>{ptw.location || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[ptw.status] ?? 'secondary'}>
                          {(ptw.status ?? '').replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{ptw.revision_number ?? 0}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" asChild>
                            <Link href={`/permits/${ptw.id}/edit`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </Button>

                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/permits/${ptw.id}`}>View</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}