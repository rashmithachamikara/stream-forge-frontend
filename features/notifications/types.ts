export interface Notification {
  id: string;
  videoId: string | null;
  notificationType: 'Comment' | 'Like' | 'Upload' | 'ProcessingComplete' | 'Reply';
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationDto {
  id?: string;
  videoId?: string | null;
  notificationType?: Notification['notificationType'];
  message?: string | null;
  isRead?: boolean;
  createdAt?: string;
}

export interface NotificationListFilters {
  isRead?: boolean;
  page?: number;
  pageSize?: number;
}

export interface UnreadNotificationCount {
  unreadCount: number;
}

export interface UnreadNotificationCountDto {
  unreadCount?: number;
}
