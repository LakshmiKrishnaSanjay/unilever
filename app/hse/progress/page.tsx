'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  title: string | null;
  location: string | null;
  status: string;
};

export default function PTWListPage() {
  const [ptws, setPtws] = useState<PTWListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPTWs();
  }, []);

  const loadPTWs = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('ptws')
        .select('id, title, location, status')
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch PTWs:', error);
        setPtws([]);
        return;
      }

      setPtws((data || []) as PTWListItem[]);
    } catch (error) {
      console.error('Unexpected fetch error:', error);
      setPtws([]);
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
            View only active work permits
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle>Progress Logs ({ptws.length})</CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p className="py-10 text-center text-muted-foreground">Loading permits...</p>
            ) : ptws.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No active permits found</p>
                <p className="text-sm text-muted-foreground">
                  Only active PTWs progress logs will appear here
                </p>
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
                      <TableCell className="font-medium">{ptw.id}</TableCell>
                      <TableCell>{ptw.title || '-'}</TableCell>
                      <TableCell>{ptw.location || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{formatStatus(ptw.status)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" asChild>
                          <Link href={`/hse/progress/${ptw.id}`}>View</Link>
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