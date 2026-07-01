'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { apiClient } from '@/shared/lib/api';
import { Button } from '@/components/ui/button';
import { Bell, MessageSquare, ThumbsUp, Upload, Cog } from 'lucide-react';
import { Notification, NotificationListFilters } from '@/features/notifications/types';
import { cn } from '@/shared/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

type ReadFilter = 'all' | 'unread' | 'read';

const formatRelative = (date: Date): string => {
  const d = date.getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const dd = Math.floor(h / 24);
  if (dd < 30) return `${dd}d ago`;
  return date.toLocaleDateString();
};

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

const ICONS = {
  Comment: MessageSquare,
  Reply: MessageSquare,
  Like: ThumbsUp,
  ProcessingComplete: Cog,
  Upload: Upload,
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
    const run = async () => {
      await loadNotifications(readFilter);
    };

    void run();
  }, [readFilter]);

  const refreshUnreadCount = async () => {
    const response = await apiClient.getUnreadNotificationCount();
    if (response.success && response.data) {
      setUnreadCount(response.data.unreadCount);
    }
  };

  const handleToggleRead = async (notification: Notification) => {
    const nextReadState = !notification.isRead;
    const response = nextReadState
      ? await apiClient.markNotificationAsRead(notification.id)
      : await apiClient.markNotificationAsUnread(notification.id);

    if (response.success) {
      setNotifications((current) =>
        current.map((item) => (item.id === notification.id ? { ...item, isRead: nextReadState } : item))
      );
      await refreshUnreadCount();
      toast.success(nextReadState ? 'Notification marked as read' : 'Notification marked as unread');
    } else {
      toast.error(response.error ?? 'Failed to update notification status');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    const response = await apiClient.deleteNotification(notificationId);

    if (response.success) {
      setNotifications((current) => current.filter((item) => item.id !== notificationId));
      await refreshUnreadCount();
      toast.success('Notification deleted');
    } else {
      toast.error(response.error ?? 'Failed to delete notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    const response = await apiClient.markAllNotificationsAsRead();

    if (response.success) {
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } else {
      toast.error(response.error ?? 'Failed to mark all notifications as read');
    }
  };

  const handleClearReadNotifications = async () => {
    const response = await apiClient.clearReadNotifications();

    if (response.success) {
      setNotifications((current) => current.filter((item) => !item.isRead));
      toast.success('Read notifications cleared');
    } else {
      toast.error(response.error ?? 'Failed to clear read notifications');
    }
  };

  return (
    <DashboardLayout title="Notifications">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Inbox</p>
            <h1 className="text-2xl font-bold tracking-tight mt-1 text-foreground">
              Notifications{' '}
              {unreadCount > 0 && (
                <span className="text-sm font-mono text-muted-foreground font-medium">({unreadCount})</span>
              )}
            </h1>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => void handleMarkAllAsRead()}
                className="text-xs px-3 py-1.5 rounded-md border border-border bg-background hover:bg-accent text-foreground transition-colors cursor-pointer"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={() => void handleClearReadNotifications()}
              className="text-xs px-3 py-1.5 rounded-md border border-border bg-background hover:bg-accent text-foreground transition-colors cursor-pointer"
            >
              Clear read
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex bg-muted rounded-md p-0.5 w-fit">
          {(['all', 'unread', 'read'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setReadFilter(f)}
              className={cn(
                'px-3 py-1 text-[11px] rounded capitalize font-semibold transition-all cursor-pointer',
                readFilter === f ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {error && (
          <div className="border border-destructive/20 bg-destructive/5 rounded-lg p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Notification items */}
        {isLoading ? (
          <div className="text-center py-20 text-sm text-muted-foreground">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="size-12 mx-auto bg-muted rounded-full grid place-items-center mb-4">
              <Bell className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold">You&apos;re all caught up</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg bg-card divide-y divide-border overflow-hidden">
            {notifications.map((n) => {
              const Icon = ICONS[n.notificationType] || Bell;
              const isUnread = !n.isRead;
              return (
                <div
                  key={n.id}
                  className={cn(
                    'w-full flex items-start gap-4 p-4 transition-colors',
                    isUnread ? 'bg-primary/[0.02]' : 'hover:bg-accent/30'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => void handleToggleRead(n)}
                    className={cn(
                      'size-9 rounded-full grid place-items-center shrink-0 transition-colors cursor-pointer',
                      isUnread
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                    title={isUnread ? 'Mark as read' : 'Mark as unread'}
                  >
                    <Icon className="size-4" />
                  </button>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className="cursor-pointer flex-1"
                          onClick={() => void handleToggleRead(n)}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-foreground">{getNotificationTitle(n)}</p>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] text-muted-foreground font-mono">
                                {formatRelative(n.createdAt)}
                              </span>
                              {isUnread && <span className="size-2 rounded-full bg-foreground shrink-0" />}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="start">
                        <p className="text-xs">Click to mark as {isUnread ? 'read' : 'unread'}</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-3">
                      {n.videoId && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-[10px] px-2 font-mono py-0 hover:bg-accent"
                          onClick={() => router.push(`/videos/${n.videoId}`)}
                        >
                          View Video
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] px-2 text-destructive hover:text-destructive hover:bg-destructive/10 font-mono py-0"
                        onClick={() => void handleDeleteNotification(n.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
