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

export type AnalyticsEventType = 'Play' | 'Pause' | 'Seek' | 'Complete' | 'Close';

export interface AnalyticsDateRange {
  from?: Date;
  to?: Date;
}

export interface AnalyticsSummary {
  totalViews: number;
  uniqueViewers: number;
  totalWatchTime: number;
  averageWatchTime: number;
  averageCompletionRate: number;
  completionCount: number;
}

export interface AnalyticsSummaryDto {
  totalViews?: number;
  uniqueViewers?: number;
  totalWatchTime?: number;
  averageWatchTime?: number;
  averageCompletionRate?: number;
  completionCount?: number;
}

export interface AnalyticsTimeSeriesPoint {
  periodStart: Date;
  viewCount: number;
}

export interface AnalyticsTimeSeriesPointDto {
  periodStart?: string;
  viewCount?: number;
}

export interface AnalyticsEngagementSummary {
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  engagementScore: number;
  engagementRate: number | null;
}

export interface AnalyticsEngagementSummaryDto {
  likeCount?: number;
  dislikeCount?: number;
  commentCount?: number;
  engagementScore?: number;
  engagementRate?: number | null;
}

export interface RankedVideoAnalytics {
  videoId: string;
  title: string;
  viewCount: number;
  totalWatchTime: number;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  engagementScore: number;
}

export interface RankedVideoAnalyticsDto {
  videoId?: string;
  title?: string | null;
  viewCount?: number;
  totalWatchTime?: number;
  likeCount?: number;
  dislikeCount?: number;
  commentCount?: number;
  engagementScore?: number;
}

export interface ActiveViewers {
  activeViewerCount: number;
  windowMinutes: number;
}

export interface ActiveViewersDto {
  activeViewerCount?: number;
  windowMinutes?: number;
}

export interface PeakWatchTimeItem {
  hourLabel: string;
  watchActivityCount: number;
}

export interface PeakWatchTimeItemDto {
  hourLabel?: string | null;
  watchActivityCount?: number;
}

export interface AnalyticsBreakdownItem {
  label: string;
  value: number;
}

export interface DeviceBreakdownItemDto {
  deviceType?: string | null;
  viewerCount?: number;
}

export interface BrowserBreakdownItemDto {
  browserFamily?: string | null;
  viewerCount?: number;
}

export interface CategoryBreakdownItemDto {
  categoryId?: string | null;
  categoryName?: string | null;
  viewCount?: number;
}

export interface TagBreakdownItemDto {
  tagId?: string;
  tagName?: string | null;
  viewCount?: number;
}

export interface AuthBreakdown {
  authenticatedViewCount: number;
  anonymousViewCount: number;
}

export interface AuthBreakdownDto {
  authenticatedViewCount?: number;
  anonymousViewCount?: number;
}

export interface RecordAnalyticsEventRequest {
  sessionId: string;
  eventType: AnalyticsEventType;
  eventTime?: string | null;
  position?: number | null;
  durationWatched?: number | null;
}

export interface RecordAnalyticsEventResult {
  eventRecorded: boolean;
  viewCountIncremented: boolean;
}

export interface RecordAnalyticsEventResultDto {
  eventRecorded?: boolean;
  viewCountIncremented?: boolean;
}

export type RankedAnalyticsKind = 'most-watched' | 'most-liked' | 'most-commented' | 'most-engaged' | 'top';
export type AnalyticsBreakdownKind = 'device' | 'browser' | 'category' | 'tag';

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
