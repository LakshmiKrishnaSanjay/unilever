'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useWorkflow } from '@/lib/use-workflow';
import { useSearchParams } from 'next/navigation';
import { formatDateTime } from '@/lib/format';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, CheckCircle, XCircle, UserCheck, Clock, Search } from 'lucide-react';

const activityIcons = {
  moc_created: FileText,
  moc_submitted: FileText,
  moc_approved: CheckCircle,
  moc_rejected: XCircle,
  ptw_created: FileText,
  ptw_submitted: FileText,
  ptw_approved: CheckCircle,
  ptw_sent_back: XCircle,
  security_checkin: UserCheck,
  security_checkout: UserCheck,
  work_completed: CheckCircle,
  job_closed: CheckCircle,
};

export default function ActivityLogPage() {
  const { activityLog, currentUser } = useWorkflow();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Filter activities based on user role
  const filteredActivities = (activityLog ?? [])
    .filter((activity) => {
      // Search filter
      const matchesSearch =
        search === '' ||
        activity.details?.toLowerCase().includes(search.toLowerCase()) ||
        activity.action?.toLowerCase().includes(search.toLowerCase()) ||
        activity.user?.toLowerCase().includes(search.toLowerCase());

      // Type filter
      const matchesType =
        filterType === 'all' ||
        (filterType === 'moc' && activity.module === 'MOC') ||
        (filterType === 'ptw' && activity.module === 'PTW');

      return matchesSearch && matchesType;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getActivityIcon = (type: string) => {
    const Icon = activityIcons[type as keyof typeof activityIcons] || Clock;
    return Icon;
  };

  const getActivityColor = (type: string) => {
    if (type.includes('approved') || type.includes('completed') || type.includes('closed'))
      return 'text-green-600';
    if (type.includes('rejected') || type.includes('sent_back')) return 'text-red-600';
    if (type.includes('checkin') || type.includes('checkout')) return 'text-blue-600';
    return 'text-muted-foreground';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Activity Log</h1>
          <p className="text-muted-foreground">
            Track all system activities and workflow changes
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <CardTitle>Recent Activities ({filteredActivities.length})</CardTitle>
              <div className="flex gap-3">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search activities..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="moc">MOC</SelectItem>
                    <SelectItem value="ptw">PTW</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium">No activities found</p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                filteredActivities.map((activity) => {
                  const Icon = getActivityIcon(activity.action || 'default');
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div
                        className={`mt-1 rounded-full p-2 ${getActivityColor(activity.action || '')}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium">{activity.action || 'Action'}</p>
                            <p className="text-sm text-muted-foreground mt-1">{activity.details}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              <span>by {activity.user || 'System'}</span>
                              {activity.status && (
                                <>
                                  <span>•</span>
                                  <Badge variant="outline" className="text-xs">
                                    {activity.status}
                                  </Badge>
                                </>
                              )}
                              <span>•</span>
                              <Badge variant="secondary" className="text-xs">
                                {activity.module}
                              </Badge>
                            </div>
                          </div>
                          <time className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatDateTime(activity.timestamp)}
                          </time>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
