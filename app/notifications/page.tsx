'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWorkflow } from '@/lib/use-workflow';
import { listRecords, updateRecord } from '@/src/demo/storage';
import Link from 'next/link';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { formatDateTime } from '@/lib/format';

interface NotificationRecord {
  id: string;
  userId: string;
  role?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  link?: string;
}

export default function NotificationsPage() {
  const { currentUser } = useWorkflow();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = () => {
    if (typeof window === 'undefined' || !currentUser) return;
    
    const allNotifications = listRecords<NotificationRecord>('notifications');
    
    // Filter by user ID or role
    const userNotifications = allNotifications.filter((n) => 
      n.userId === currentUser.id || n.role === currentUser.role
    );
    
    // Sort by most recent first
    userNotifications.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
    
    setNotifications(userNotifications);
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();
  }, [currentUser]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    updateRecord('notifications', id, { read: true });
    loadNotifications();
  };

  const handleMarkAllRead = () => {
    notifications.filter((n) => !n.read).forEach((n) => {
      updateRecord('notifications', n.id, { read: true });
    });
    loadNotifications();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllRead} variant="outline">
              <Check className="mr-2 h-4 w-4" />
              Mark All Read
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">No notifications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 rounded-lg border p-4 ${
                      !notification.read ? 'bg-primary/5 border-primary/20' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{notification.title}</h3>
                        {!notification.read && (
                          <Badge variant="default" className="text-xs">
                            New
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {notification.type}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatDateTime(new Date(notification.createdAt))}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {notification.link && (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={notification.link}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      {!notification.read && (
                        <Button size="sm" variant="ghost" onClick={() => handleMarkAsRead(notification.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
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
