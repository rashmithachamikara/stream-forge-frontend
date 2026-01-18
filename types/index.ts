// User & Authentication Types
export type UserRole = 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

// Video Types
export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  uploadedBy: string;
  uploadedAt: Date;
  views: number;
  categories: string[];
  tags: string[];
  visibility: 'public' | 'private' | 'restricted';
  hlsUrl: string;
  transcriptUrl?: string;
  transcodedVersions: TranscodedVersion[];
}

export interface TranscodedVersion {
  resolution: string;
  format: string;
  bitrate: string;
  url: string;
}

// Playlist Types
export interface Playlist {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  videoIds: string[];
  isPublic: boolean;
}

// Bookmark Types
export interface Bookmark {
  id: string;
  videoId: string;
  userId: string;
  timestamp: number;
  title: string;
  createdAt: Date;
}

// Analytics Types
export interface ViewAnalytics {
  videoId: string;
  date: Date;
  views: number;
}

export interface VideoAnalytics {
  videoId: string;
  title: string;
  views: number;
  avgWatchTime: number;
  completionRate: number;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
