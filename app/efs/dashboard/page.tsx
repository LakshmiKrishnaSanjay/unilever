'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import type { PTW } from '@/lib/types';

export default function EFSDashboardPage() {
  const [pendingReviews, setPendingReviews] = useState<PTW[]>([]);
  const [pendingClosures, setPendingClosures] = useState<PTW[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPTWs = async () => {
      try {
        setLoading(true);
        setError(null);

        const [reviewRes, closureRes] = await Promise.all([
          supabase
            .from('ptws')
            .select('*')
            .eq('status', 'PENDING_EFS_REVIEW')
            .order('created_at', { ascending: false }),

          supabase
            .from('ptws')
            .select('*')
            .eq('status', 'PENDING_EFS_CLOSURE')
            .order('created_at', { ascending: false }),
        ]);

        if (reviewRes.error) throw reviewRes.error;
        if (closureRes.error) throw closureRes.error;

        setPendingReviews((reviewRes.data || []) as PTW[]);
        setPendingClosures((closureRes.data || []) as PTW[]);
      } catch (err: any) {
        console.error('Failed to fetch EFS dashboard PTWs:', err);
        setError(err.message || 'Failed to load permits');
      } finally {
        setLoading(false);
      }
    };

    fetchPTWs();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">EFS Team Dashboard</h1>
          <p className="text-muted-foreground">
            Review engineering and facility systems permits
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : pendingReviews.length}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting EFS review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Closures</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : pendingClosures.length}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting EFS closure review</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Review Queue</CardTitle>
              <Badge variant="outline">{loading ? '...' : pendingReviews.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading permits...</p>
            ) : error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : pendingReviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No permits awaiting review</p>
            ) : (
              <div className="space-y-3">
                {pendingReviews.map((ptw) => (
                  <div
                    key={ptw.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{ptw.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {ptw.id} • {ptw.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>{ptw.permit_type}</Badge>
                      <Button size="sm" asChild>
                        <Link href={`/efs/review?ptwId=${ptw.id}`}>Review</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Job Closure Reviews</CardTitle>
              <Badge variant="outline">{loading ? '...' : pendingClosures.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading closure queue...</p>
            ) : error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : pendingClosures.length === 0 ? (
              <p className="text-sm text-muted-foreground">No jobs awaiting closure review</p>
            ) : (
              <div className="space-y-3">
                {pendingClosures.map((ptw) => (
                  <div
                    key={ptw.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{ptw.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {ptw.id} • {ptw.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Pending EFS Closure</Badge>
                      <Button size="sm" asChild>
                        <Link href="/efs/closure">Review Closure</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}