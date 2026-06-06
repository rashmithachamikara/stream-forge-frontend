import { UserRole } from '@/features/auth/types';

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

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}

export interface UserProfileDto {
  id?: string;
  name?: string | null;
  email?: string | null;
  role?: 'Admin' | 'Editor' | 'Viewer';
  isActive?: boolean | null;
  createdAt?: string;
}

export interface UserListFilters {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}
