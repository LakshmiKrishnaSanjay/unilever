'use client';

import { useEffect, useState } from 'react';
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
  ptw?: PTWRow | null;
};

export default function SecurityProgressPage() {
  const [logs, setLogs] = useState<PTWWorkLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);

      const [logsRes, ptwsRes] = await Promise.all([
        supabase
          .from('ptw_work_logs')
          .select('*')
          .order('created_at', { ascending: false }),

        supabase
          .from('ptws')
          .select('id, title, location, status'),
      ]);

      if (logsRes.error) {
        console.error('Failed to fetch work logs:', logsRes.error);
        setLogs([]);
        setLoading(false);
        return;
      }

      if (ptwsRes.error) {
        console.error('Failed to fetch ptws:', ptwsRes.error);
        setLogs((logsRes.data || []).map((log) => ({ ...log, ptw: null })));
        setLoading(false);
        return;
      }

      const ptwMap = new Map(
        (ptwsRes.data || []).map((ptw) => [String(ptw.id), ptw])
      );

      const mergedLogs: PTWWorkLog[] = (logsRes.data || []).map((log) => ({
        ...log,
        ptw: ptwMap.get(String(log.ptw_id)) || null,
      }));

      setLogs(mergedLogs);
      setLoading(false);
    };

    fetchLogs();
  }, []);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
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
          <h1 className="text-3xl font-semibold">Progress Logs</h1>
          <p className="text-muted-foreground">
            View hourly work progress logs from supervisors
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle>Recent Work Progress</CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading logs...</p>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Activity className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No progress logs yet</p>
                <p className="text-sm text-muted-foreground">
                  Supervisors will add hourly logs for active work
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permit</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Logged By</TableHead>
                    <TableHead>Current Status</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {log.ptw?.title || 'Unknown Permit'}
                          </span>
                          <span className="text-xs ">
                          PTW ID - {log.ptw_id}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {log.ptw?.location || '-'}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-sm">
                        {formatDateTime(log.created_at)}
                      </TableCell>

                      <TableCell className="text-sm">
                        {log.logged_by || 'Unknown'}
                      </TableCell>

                      <TableCell className="text-sm">
                        {log.current_status}
                      </TableCell>

                      <TableCell>
                        <div className="space-y-2">
                          <p className="text-sm">{log.remarks}</p>
                          {log.photo_url && (
                            <img
                              src={log.photo_url}
                              alt="Work progress"
                              className="mt-2 max-h-60 w-full rounded-md object-cover"
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