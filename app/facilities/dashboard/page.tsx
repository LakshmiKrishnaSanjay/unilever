'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWorkflow } from '@/lib/use-workflow';
import Link from 'next/link';
import { ClipboardCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FacilitiesDashboardPage() {
  const { ptws } = useWorkflow();
  const pendingReviews = ptws.filter((p) => p.status === 'PENDING_FACILITIES_REVIEW');
  const pendingClosures = ptws.filter((p) => p.status === 'WORK_COMPLETED');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Facilities Dashboard</h1>
          <p className="text-muted-foreground">Review permits and approve job closures</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending PTW Reviews</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingReviews.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting facilities review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Closures</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingClosures.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting closure approval</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Review Queue</CardTitle>
              <Badge variant="outline">{pendingReviews.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {pendingReviews.length === 0 ? (
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
                        <Link href={`/facilities/review`}>Review</Link>
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
              <Badge variant="outline">{pendingClosures.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {pendingClosures.length === 0 ? (
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
                      <Badge variant="secondary">Work Completed</Badge>
                      <Button size="sm" asChild>
                        <Link href={`/facilities/closure?ptwId=${ptw.id}`}>Review Closure</Link>
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
