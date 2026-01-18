'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { Notification } from '@/types';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      userId: 'user1',
      title: 'Video Upload Complete',
      message: 'Your video "Getting Started Tutorial" has been successfully processed and is now live.',
      type: 'success',
      read: false,
      createdAt: new Date('2024-02-15T10:30:00'),
      actionUrl: '/videos/1',
    },
    {
      id: '2',
      userId: 'user1',
      title: 'New Comment on Your Video',
      message: 'John replied to your video "Advanced Features Tour".',
      type: 'info',
      read: false,
      createdAt: new Date('2024-02-15T09:15:00'),
      actionUrl: '/videos/2',
    },
    {
      id: '3',
      userId: 'user1',
      title: 'Storage Warning',
      message: 'Your account is using 85% of available storage. Consider deleting old videos.',
      type: 'warning',
      read: true,
      createdAt: new Date('2024-02-14T16:45:00'),
    },
    {
      id: '4',
      userId: 'user1',
      title: 'Video Processing Error',
      message: 'Failed to process video "Demo Video". Please check the file format and try again.',
      type: 'error',
      read: true,
      createdAt: new Date('2024-02-14T14:20:00'),
      actionUrl: '/videos/4',
    },
    {
      id: '5',
      userId: 'user1',
      title: 'System Maintenance',
      message: 'Scheduled maintenance will occur on February 16 from 2:00 AM to 4:00 AM UTC.',
      type: 'info',
      read: true,
      createdAt: new Date('2024-02-13T12:00:00'),
    },
    {
      id: '6',
      userId: 'user1',
      title: 'New User Created',
      message: 'Admin has created a new account: john.doe@example.com',
      type: 'success',
      read: true,
      createdAt: new Date('2024-02-12T08:30:00'),
    },
  ]);

  const handleMarkAsRead = (id: string) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter((notif) => notif.id !== id));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(
      notifications.map((notif) => ({ ...notif, read: true }))
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    const iconProps = { className: 'h-5 w-5' };
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} className="text-green-600" />;
      case 'error':
        return <AlertCircle {...iconProps} className="text-red-600" />;
      case 'warning':
        return <AlertTriangle {...iconProps} className="text-yellow-600" />;
      case 'info':
      default:
        return <Info {...iconProps} className="text-blue-600" />;
    }
  };

  const getBadgeColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <DashboardLayout title="Notifications">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`transition-all ${
                  !notification.read ? 'bg-primary/5 border-primary/20' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getBadgeColor(notification.type)} variant="outline">
                            {notification.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {notification.createdAt.toLocaleDateString()} at{' '}
                            {notification.createdAt.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {notification.actionUrl && (
                            <Button variant="ghost" size="sm" className="h-8 text-xs">
                              View
                            </Button>
                          )}
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleMarkAsRead(notification.id)}
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(notification.id)}
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
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">No notifications</p>
              <p className="text-sm text-muted-foreground">
                You're all caught up! Check back later for updates.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">Notification Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>
                <strong>Success:</strong> Video processing completed, upload successful
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span>
                <strong>Error:</strong> Processing failed, access issues
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span>
                <strong>Warning:</strong> Storage limits, quota approaching
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span>
                <strong>Info:</strong> System updates, new features, comments
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
