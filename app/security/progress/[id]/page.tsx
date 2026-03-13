'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type PTWRow = {
  id: string;
  title: string;
  location: string;
  status: string;
};

type PTWWorkLog = {
  id: string;
  ptw_id: string;
  logged_by: string | null;
  current_status: string;
  remarks: string;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
};

export default function HSEProgressDetailsPage() {
  const params = useParams();
  const ptwId = params?.id as string;

  const [permit, setPermit] = useState<PTWRow | null>(null);
  const [logs, setLogs] = useState<PTWWorkLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ptwId) return;

    const fetchData = async () => {
      setLoading(true);

      const [ptwRes, logsRes] = await Promise.all([
        supabase
          .from('ptws')
          .select('id, title, location, status')
          .eq('id', ptwId)
          .maybeSingle(),

        supabase
          .from('ptw_work_logs')
          .select('*')
          .eq('ptw_id', ptwId)
          .order('created_at', { ascending: false }),
      ]);

      if (ptwRes.error) {
        console.error('Failed to fetch permit:', ptwRes.error);
        setPermit(null);
      } else {
        setPermit(ptwRes.data || null);
      }

      if (logsRes.error) {
        console.error('Failed to fetch logs:', logsRes.error);
        setLogs([]);
      } else {
        setLogs(logsRes.data || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [ptwId]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Permit Progress Details</h1>
          <p className="text-muted-foreground">
            Full details and progress logs for this permit
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Permit Details</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading permit...</p>
            ) : !permit ? (
              <p className="text-sm text-muted-foreground">Permit not found</p>
            ) : (
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Permit ID:</span> {permit.id}</p>
                <p><span className="font-medium">Permit Name:</span> {permit.title}</p>
                <p><span className="font-medium">Location:</span> {permit.location}</p>
                <p><span className="font-medium">Status:</span> {permit.status}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle>Progress Logs</CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading logs...</p>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Activity className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No progress logs found</p>
                <p className="text-sm text-muted-foreground">
                  No supervisor logs available for this permit
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Logged By</TableHead>
                    <TableHead>Current Status</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{formatDateTime(log.created_at)}</TableCell>
                      <TableCell>{log.logged_by || 'Unknown'}</TableCell>
                      <TableCell>{log.current_status}</TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <p className="text-sm">{log.remarks}</p>
                          {log.photo_url && (
                            <img
                              src={log.photo_url}
                              alt="Work progress"
                              className="mt-2 max-h-72 w-full rounded-md object-cover"
                            />
                          )}
                        </div>
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