'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { listRecords } from '@/src/demo/storage';
import type { MOCRecord } from '@/src/types/moc';
import Link from 'next/link';
import { Search, CheckCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  SUBMITTED: 'secondary',
  STAKEHOLDER_SIGNED: 'secondary',
  CONTRACTOR_SUBMITTED: 'outline',
  FACILITIES_APPROVED: 'default',
  FACILITIES_CHANGES_REQUESTED: 'destructive',
  STAKEHOLDER_APPROVED: 'default',
  APPROVED: 'default',
  REJECTED: 'destructive',
};

export default function FacilitiesMOCsPage() {
  const [mocs, setMocs] = useState<MOCRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const allMocs = listRecords<MOCRecord>('moc');
    
    // Sort by most recent first
    allMocs.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    setMocs(allMocs);
    setLoading(false);
  }, []);

  const filteredMOCs = mocs.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase()) ||
      m.area.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">All MOCs</h1>
            <p className="text-muted-foreground">
              View all Management of Change records
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search MOCs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <p className="text-muted-foreground">Loading MOCs...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>MOC ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Contractor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMOCs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No MOCs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMOCs.map((moc) => {
                      const isApproved = moc.status === 'APPROVED';

                      return (
                        <TableRow key={moc.id}>
                          <TableCell className="font-medium">{moc.id}</TableCell>
                          <TableCell>
                            <div className="max-w-[200px]">
                              <p className="font-medium truncate">{moc.title}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {moc.description}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{moc.area}</TableCell>
                          <TableCell className="text-sm">{moc.contractorCompany}</TableCell>
                          <TableCell>
                            <Badge variant={statusColors[moc.status]}>
                              {isApproved && <CheckCircle className="mr-1 h-3 w-3" />}
                              {moc.status.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(moc.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/moc/${moc.id}`}>View</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
