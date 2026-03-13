'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Shield, Clock, CheckCircle, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import type { PTW, SecurityLog } from '@/lib/types';

export default function SecurityDashboardPage() {
  const [ptws, setPtws] = useState<PTW[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [ptwRes, securityLogRes] = await Promise.all([
          supabase
            .from('ptws')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase
            .from('security_logs')
            .select('*')
            .order('check_in_time', { ascending: false }),
        ]);

        if (ptwRes.error) throw ptwRes.error;
        if (securityLogRes.error) throw securityLogRes.error;

        setPtws((ptwRes.data || []) as PTW[]);
        setSecurityLogs((securityLogRes.data || []) as SecurityLog[]);
      } catch (err: any) {
        console.error('Failed to fetch security dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const checkedInActivePTWs = ptws.filter(
  (p) =>
    p.status === 'ACTIVE' &&
    !!p.entry_approved_by &&
    !p.security_checkout_confirmed_by
);

const stats = {
  pendingReviews: ptws.filter((p) => p.status === 'PENDING_SECURITY_REVIEW').length,
  activePTWs: ptws.filter((p) => p.status === 'ACTIVE').length,
  readyToStart: checkedInActivePTWs.length,
  totalLogs: securityLogs.length,
};

  const pendingPTWs = ptws.filter((p) => p.status === 'PENDING_SECURITY_REVIEW');
  const activePTWs = ptws.filter((p) => p.status === 'ACTIVE');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Security Dashboard</h1>
          <p className="text-muted-foreground">Review permits and monitor active work</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.pendingReviews}</div>
              <p className="text-xs text-muted-foreground">Awaiting security review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active PTWs</CardTitle>
              <Activity className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.activePTWs}</div>
              <p className="text-xs text-muted-foreground">Work in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ready to Start</CardTitle>
              <CheckCircle className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.readyToStart}</div>
              <p className="text-xs text-muted-foreground">Awaiting check-in</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Logs</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalLogs}</div>
              <p className="text-xs text-muted-foreground">Check-in records</p>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-red-500">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pending Reviews</CardTitle>
                <Badge variant="outline">{loading ? '...' : pendingPTWs.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading pending reviews...</p>
              ) : pendingPTWs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending reviews</p>
              ) : (
                <div className="space-y-3">
                  {pendingPTWs.slice(0, 4).map((ptw) => (
                    <div
                      key={ptw.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{ptw.title}</p>
                        <p className="text-sm text-muted-foreground">{ptw.id}</p>
                      </div>
                      <Badge>{ptw.permit_type}</Badge>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full bg-transparent" asChild>
                    <Link href="/security/review">View All Reviews</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Work</CardTitle>
                <Badge variant="outline">{loading ? '...' : activePTWs.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading active work...</p>
              ) : activePTWs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active work</p>
              ) : (
                <div className="space-y-3">
                  {activePTWs.map((ptw) => (
                    <div
                      key={ptw.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{ptw.title}</p>
                        <p className="text-sm text-muted-foreground">{ptw.location}</p>
                      </div>
                      <Button size="sm" asChild>
                        <Link href={`/security/progress?ptwId=${ptw.id}`}>Monitor</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}