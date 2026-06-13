'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { apiClient } from '@/shared/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  CheckCircle,
  Info,
  Trash2,
  Check,
  X,
  MessageSquare,
  ThumbsUp,
  Upload,
  Reply,
} from 'lucide-react';
import { Notification, NotificationListFilters } from '@/features/notifications/types';
import { AppEmptyState, ErrorPanel, LoadingPanel, PageHeader } from '@/shared/components/AppChrome';

type ReadFilter = 'all' | 'read' | 'unread';

const READ_FILTER_OPTIONS: Array<{ label: string; value: ReadFilter }> = [
  { label: 'All notifications', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'Read', value: 'read' },
];

const getNotificationTitle = (notification: Notification) => {
  switch (notification.notificationType) {
    case 'Comment':
      return 'New Comment';
    case 'Reply':
      return 'New Reply';
    case 'Like':
      return 'New Reaction';
    case 'ProcessingComplete':
      return 'Processing Complete';
    case 'Upload':
    default:
      return 'Upload Update';
  }
};

const getNotificationIcon = (type: Notification['notificationType']) => {
  const iconProps = { className: 'h-5 w-5' };

  switch (type) {
    case 'Comment':
      return <MessageSquare {...iconProps} className="text-blue-600" />;
    case 'Reply':
      return <Reply {...iconProps} className="text-blue-600" />;
    case 'Like':
      return <ThumbsUp {...iconProps} className="text-green-600" />;
    case 'ProcessingComplete':
      return <CheckCircle {...iconProps} className="text-green-600" />;
    case 'Upload':
    default:
      return <Upload {...iconProps} className="text-blue-600" />;
  }
};

const getBadgeColor = (type: Notification['notificationType']) => {
  switch (type) {
    case 'Like':
    case 'ProcessingComplete':
      return 'bg-green-100 text-green-800';
    case 'Comment':
    case 'Reply':
    case 'Upload':
    default:
      return 'bg-blue-100 text-blue-800';
  }
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = async (filter: ReadFilter) => {
    setIsLoading(true);
    setError(null);

    const filters: NotificationListFilters = {
      isRead: filter === 'all' ? undefined : filter === 'read',
      page: 1,
      pageSize: 50,
    };

    const [notificationsResponse, unreadCountResponse] = await Promise.all([
      apiClient.getNotifications(filters),
      apiClient.getUnreadNotificationCount(),
    ]);

    if (notificationsResponse.success && notificationsResponse.data) {
      setNotifications(notificationsResponse.data.items);
    } else {
      setNotifications([]);
      setError(notificationsResponse.error ?? 'Failed to load notifications');
    }

    if (unreadCountResponse.success && unreadCountResponse.data) {
      setUnreadCount(unreadCountResponse.data.unreadCount);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    void loadNotifications(readFilter);
  }, [readFilter]);

  const refreshUnreadCount = async () => {
    const response = await apiClient.getUnreadNotificationCount();
    if (response.success && response.data) {
      setUnreadCount(response.data.unreadCount);
    }
  };

  const handleMarkAsRead = async (notification: Notification) => {
    const response = await apiClient.markNotificationAsRead(notification.id);

    if (response.success) {
      setNotifications((current) =>
        current.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item))
      );
      await refreshUnreadCount();
    } else {
      setError(response.error ?? 'Failed to mark notification as read');
    }
  };

  const handleMarkAsUnread = async (notification: Notification) => {
    const response = await apiClient.markNotificationAsUnread(notification.id);

    if (response.success) {
      setNotifications((current) =>
        current.map((item) => (item.id === notification.id ? { ...item, isRead: false } : item))
      );
      await refreshUnreadCount();
    } else {
      setError(response.error ?? 'Failed to mark notification as unread');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    const response = await apiClient.deleteNotification(notificationId);

    if (response.success) {
      setNotifications((current) => current.filter((item) => item.id !== notificationId));
      await refreshUnreadCount();
    } else {
      setError(response.error ?? 'Failed to delete notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    const response = await apiClient.markAllNotificationsAsRead();

    if (response.success) {
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } else {
      setError(response.error ?? 'Failed to mark all notifications as read');
    }
  };

  const handleClearReadNotifications = async () => {
    const response = await apiClient.clearReadNotifications();

    if (response.success) {
      setNotifications((current) => current.filter((item) => !item.isRead));
    } else {
      setError(response.error ?? 'Failed to clear read notifications');
    }
  };

  return (
    <DashboardLayout title="Notifications">
      <div className="space-y-6">
        <PageHeader
          title="Notifications"
          description={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}.`}
          action={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={readFilter} onValueChange={(value) => setReadFilter(value as ReadFilter)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {READ_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {unreadCount > 0 && (
              <Button variant="outline" onClick={() => void handleMarkAllAsRead()}>
                Mark all as read
              </Button>
            )}
            <Button variant="outline" onClick={() => void handleClearReadNotifications()}>
              Clear read
            </Button>
          </div>
          }
        />

        {error && <ErrorPanel message={error} />}

        {isLoading ? (
          <LoadingPanel label="Loading notifications" />
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card key={notification.id} className={!notification.isRead ? 'border-primary/20 bg-primary/5' : ''}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="mt-1 flex-shrink-0">{getNotificationIcon(notification.notificationType)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground">{getNotificationTitle(notification)}</h3>
                        {!notification.isRead && <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />}
                      </div>
                      <p className="mb-3 text-sm text-muted-foreground">{notification.message}</p>
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={getBadgeColor(notification.notificationType)} variant="outline">
                            {notification.notificationType}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {notification.createdAt.toLocaleDateString()} at{' '}
                            {notification.createdAt.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {notification.videoId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => router.push(`/videos/${notification.videoId}`)}
                            >
                              View
                            </Button>
                          )}
                          {!notification.isRead ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => void handleMarkAsRead(notification)}
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => void handleMarkAsUnread(notification)}
                              title="Mark as unread"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => void handleDeleteNotification(notification.id)}
                            title="Delete notification"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <AppEmptyState title="No notifications" description="You are all caught up." />
        )}

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">Notification Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>
                <strong>Upload and processing:</strong> Upload updates and completed processing
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <span>
                <strong>Comments:</strong> New comments and replies on your videos
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-green-600" />
              <span>
                <strong>Reactions:</strong> Likes on your content
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span>
                <strong>Status:</strong> Read and unread items can be filtered and managed here
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
