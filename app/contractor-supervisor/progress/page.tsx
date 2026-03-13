'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWorkflow } from '@/lib/use-workflow';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText } from 'lucide-react';

type PTWListItem = {
  id: string;
  moc_id: string | null;
  title: string | null;
  location: string | null;
  status: string;
};

export default function PTWListPage() {
  const { currentUser } = useWorkflow();

  const [ptws, setPtws] = useState<PTWListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.email) return;
    loadPTWs();
  }, [currentUser]);

  const loadPTWs = async () => {
    try {
      setLoading(true);

      // STEP 1: get approved supervisor MOCs
      const { data: supervisorRequests, error: supError } = await supabase
        .from('supervisor_requests')
        .select('moc_id')
        .eq('email', currentUser.email)
        .eq('status', 'approved');

      if (supError) {
        console.error(supError);
        return;
      }

      const mocIds = supervisorRequests?.map((r) => r.moc_id) || [];

      if (mocIds.length === 0) {
        setPtws([]);
        return;
      }

      // STEP 2: fetch PTWs only from those MOCs
      const { data, error } = await supabase
        .from('ptws')
        .select('id, title, location, status, moc_id')
        .eq('status', 'ACTIVE')
        .in('moc_id', mocIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setPtws(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status: string) => status.replace(/_/g, ' ');

  return (
    <DashboardLayout>
      <div className="space-y-6">

        <div>
          <h1 className="text-3xl font-semibold">Active Progress Logs</h1>
          <p className="text-muted-foreground">
            Only permits linked to your assigned MOCs are visible
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle>Active Permits ({ptws.length})</CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p className="py-10 text-center text-muted-foreground">
                Loading permits...
              </p>
            ) : ptws.length === 0 ? (
              <div className="flex flex-col items-center py-12">
                <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No active permits found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permit ID</TableHead>
                    <TableHead>Permit Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {ptws.map((ptw) => (
                    <TableRow key={ptw.id}>
                      <TableCell>{ptw.id}</TableCell>
                      <TableCell>{ptw.title || '-'}</TableCell>
                      <TableCell>{ptw.location || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatStatus(ptw.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" asChild>
                          <Link href={`/hse/progress/${ptw.id}`}>
                            View
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