import { AuthResponseDto, AuthSession, AuthUserDto, User, UserRole } from '@/features/auth/types';
import {
  AccessGrant,
  AccessGrantDto,
  AccessGrantListFilters,
  AccessGrantPermission,
  BookmarkDto,
  BookmarkListFilters,
  Category,
  CategoryDto,
  Comment,
  CommentDto,
  CommentListFilters,
  CreateBookmarkRequest,
  CreateCommentRequest,
  ReactionSummary,
  ReactionSummaryDto,
  ReactionType,
  SetReactionRequest,
  TagSummaryDto,
  TagSummary,
  UpdateBookmarkRequest,
  UpdateCommentRequest,
  Video,
  VideoDetailDto,
  VideoBookmark,
  VideoListFilters,
  VideoProcessingStatus,
  VideoProcessingStatusDto,
  VideoSummaryDto,
} from '@/features/videos/types';
import { UserListFilters, UserProfile, UserProfileDto } from '@/features/admin/types';
import { Playlist } from '@/features/playlists/types';
import {
  Notification,
  NotificationDto,
  NotificationListFilters,
  UnreadNotificationCount,
  UnreadNotificationCountDto,
} from '@/features/notifications/types';
import { VideoAnalytics } from '@/features/admin/types';
import { ApiResponse, PaginatedResponse } from '@/shared/types/api';
import { capitalize } from '@/shared/lib/utils';
import { getVideoManifestUrl, getVideoThumbnailUrl } from '@/features/videos/lib/playbackUrls';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.streamforge.local';
const API_V1_PREFIX = '/api/v1';

const numericRoleMap: Record<number, UserRole> = {
  1: 'admin',
  2: 'editor',
  3: 'viewer',
};

const stringRoleMap: Record<string, UserRole> = {
  admin: 'admin',
  editor: 'editor',
  viewer: 'viewer',
};

const backendUserRoleMap: Record<string, UserRole> = {
  admin: 'admin',
  editor: 'editor',
  viewer: 'viewer',
};

const normalizeApiBaseUrl = (url: string) => url.replace(/\/+$/, '');
const resolveApiUrl = (url: string | null | undefined) => {
  if (!url) {
    return undefined;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  return `${normalizeApiBaseUrl(API_BASE_URL)}${normalizedPath}`;
};
const emptyPagedResponse = <T>(page = 1, pageSize = 24): PaginatedResponse<T> => ({
  items: [],
  page,
  pageSize,
  totalCount: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
});

const appendQueryParam = (params: URLSearchParams, key: string, value: string | number | boolean | undefined) => {
  if (value !== undefined && value !== '') {
    params.set(key, String(value));
  }
};

const mapAuthUser = (user: AuthUserDto): User => {
  const role =
    typeof user.role === 'number'
      ? numericRoleMap[user.role]
      : typeof user.role === 'string'
        ? stringRoleMap[user.role.toLowerCase()]
        : undefined;

  if (!user.id || !user.email || !user.name || !role) {
    throw new Error('Invalid auth user response');
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role,
    createdAt: new Date(),
  };
};

const mapAuthResponse = (response: AuthResponseDto): AuthSession => {
  if (
    !response.user ||
    !response.accessToken ||
    !response.refreshToken ||
    !response.accessTokenExpiresAt ||
    !response.refreshTokenExpiresAt
  ) {
    throw new Error('Invalid auth response');
  }

  return {
    user: mapAuthUser(response.user),
    token: response.accessToken,
    refreshToken: response.refreshToken,
    accessTokenExpiresAt: response.accessTokenExpiresAt,
    refreshTokenExpiresAt: response.refreshTokenExpiresAt,
  };
};

const normalizeVideoVisibility = (visibility?: string): Video['visibility'] => {
  switch (visibility) {
    case 'Private':
      return 'private';
    case 'Internal':
      return 'internal';
    case 'Public':
    default:
      return 'public';
  }
};

const mapTagSummary = (tag: TagSummaryDto): TagSummary => ({
  id: tag.id ?? '',
  name: tag.name ?? 'Untitled tag',
  usageCount: tag.usageCount ?? 0,
});

const mapCategory = (category: CategoryDto): Category => ({
  id: category.id ?? '',
  name: category.name ?? 'Uncategorized',
  description: category.description ?? '',
  parentCategoryId: category.parentCategoryId ?? null,
  displayOrder: category.displayOrder ?? 0,
  createdAt: category.createdAt ? new Date(category.createdAt) : new Date(),
});

const mapVideoSummary = (video: VideoSummaryDto): Video => {
  const videoId = video.id ?? '';
  const tags = (video.tags ?? []).map(mapTagSummary);
  const categoryNames = video.categoryName ? [video.categoryName] : [];

  return {
    id: videoId,
    title: video.title ?? 'Untitled video',
    description: video.description ?? '',
    thumbnail: resolveApiUrl(video.thumbnailUrl) || getVideoThumbnailUrl(videoId),
    duration: 0,
    uploadedBy: video.uploaderName ?? 'Unknown uploader',
    uploadedAt: video.createdAt ? new Date(video.createdAt) : new Date(),
    views: video.viewCount ?? 0,
    categories: categoryNames,
    tags: tags.map((tag) => tag.name),
    visibility: normalizeVideoVisibility(video.visibility),
    hlsUrl: resolveApiUrl(video.playbackManifestUrl) || getVideoManifestUrl(videoId),
    transcodedVersions: [],
    categoryId: video.categoryId ?? null,
    status: video.status,
    updatedAt: video.updatedAt ? new Date(video.updatedAt) : undefined,
  };
};

const mapVideoDetail = (video: VideoDetailDto): Video => ({
  ...mapVideoSummary(video),
  allowComments: video.allowComments ?? true,
  allowLikes: video.allowLikes ?? true,
  allowBookmarks: video.allowBookmarks ?? true,
  autoplay: video.autoplay ?? false,
  loop: video.loop ?? false,
  defaultVolume: video.defaultVolume ?? 100,
  captionsEnabled: video.captionsEnabled ?? false,
  playerTheme: video.playerTheme ?? null,
});

const mapVideoProcessingStatus = (status: VideoProcessingStatusDto): VideoProcessingStatus => ({
  videoId: status.videoId ?? '',
  videoStatus: status.videoStatus ?? 'Processing',
  processingJobId: status.processingJobId ?? null,
  jobType: status.jobType ?? '',
  jobStatus: status.jobStatus ?? '',
  progress: status.progress ?? null,
  errorMessage: status.errorMessage ?? null,
  startedAt: status.startedAt ? new Date(status.startedAt) : null,
  completedAt: status.completedAt ? new Date(status.completedAt) : null,
});

const mapReactionSummary = (summary: ReactionSummaryDto): ReactionSummary => ({
  videoId: summary.videoId ?? '',
  likeCount: summary.likeCount ?? 0,
  dislikeCount: summary.dislikeCount ?? 0,
  currentUserReaction: summary.currentUserReaction ?? null,
});

const mapComment = (comment: CommentDto): Comment => ({
  id: comment.id ?? '',
  videoId: comment.videoId ?? '',
  userId: comment.userId ?? '',
  userName: comment.userName ?? 'Unknown user',
  parentCommentId: comment.parentCommentId ?? null,
  comment: comment.comment ?? '',
  replyCount: comment.replyCount ?? 0,
  isEdited: comment.isEdited ?? false,
  createdAt: comment.createdAt ? new Date(comment.createdAt) : new Date(),
  updatedAt: comment.updatedAt ? new Date(comment.updatedAt) : new Date(),
});

const mapBookmark = (bookmark: BookmarkDto): VideoBookmark => ({
  id: bookmark.id ?? '',
  videoId: bookmark.videoId ?? '',
  timestampSeconds: bookmark.timestampSeconds ?? 0,
  note: bookmark.note ?? null,
  createdAt: bookmark.createdAt ? new Date(bookmark.createdAt) : new Date(),
  updatedAt: bookmark.updatedAt ? new Date(bookmark.updatedAt) : new Date(),
  video: bookmark.video ? mapVideoSummary(bookmark.video) : null,
});

const mapNotification = (notification: NotificationDto): Notification => ({
  id: notification.id ?? '',
  videoId: notification.videoId ?? null,
  notificationType: notification.notificationType ?? 'Upload',
  message: notification.message ?? '',
  isRead: notification.isRead ?? false,
  createdAt: notification.createdAt ? new Date(notification.createdAt) : new Date(),
});

const mapUnreadNotificationCount = (count: UnreadNotificationCountDto): UnreadNotificationCount => ({
  unreadCount: count.unreadCount ?? 0,
});

const mapAccessGrant = (grant: AccessGrantDto): AccessGrant => ({
  id: grant.id ?? '',
  videoId: grant.videoId ?? '',
  userId: grant.userId ?? null,
  userName: grant.userName ?? null,
  shareToken: grant.shareToken ?? null,
  permissionType: grant.permissionType ?? 'View',
  expiresAt: grant.expiresAt ? new Date(grant.expiresAt) : null,
  isActive: grant.isActive ?? false,
  createdAt: grant.createdAt ? new Date(grant.createdAt) : new Date(),
});

const mapUserProfile = (user: UserProfileDto): UserProfile => ({
  id: user.id ?? '',
  name: user.name ?? 'Unknown user',
  email: user.email ?? '',
  role: backendUserRoleMap[String(user.role ?? 'Viewer').toLowerCase()] ?? 'viewer',
  isActive: user.isActive ?? false,
  createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
});

const mapPagedResponse = <TDto, TDomain>(
  response: PaginatedResponse<TDto>,
  mapper: (item: TDto) => TDomain
): PaginatedResponse<TDomain> => ({
  items: (response.items ?? []).map(mapper),
  page: response.page ?? 1,
  pageSize: response.pageSize ?? 24,
  totalCount: response.totalCount ?? 0,
  totalPages: response.totalPages ?? 0,
  hasNextPage: response.hasNextPage ?? false,
  hasPreviousPage: response.hasPreviousPage ?? false,
});

class ApiClient {
  private token: string | null = null;
  private baseUrl = normalizeApiBaseUrl(API_BASE_URL);

  constructor() {
    // Load token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
    }
  }

  setAuthToken(token: string) {
    this.token = token;
  }

  clearAuth() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }

  private async requestRaw<T>(path: string, options: RequestInit = {}): Promise<T> {
    const isFormData = options.body instanceof FormData;
    const headers = new Headers(options.headers);

    if (!isFormData && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.clearAuth();
    }

    const data = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw new Error(data?.error || data?.message || 'Request failed');
    }

    return data;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const data = await this.requestRaw<T>(path, options);
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Request failed',
      };
    }
  }

  // Authentication Endpoints
  async login(email: string, password: string): Promise<ApiResponse<AuthSession>> {
    try {
      const response = await this.requestRaw<AuthResponseDto>(`${API_V1_PREFIX}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const session = mapAuthResponse(response);
      this.setAuthToken(session.token);

      return {
        success: true,
        data: session,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid email or password',
      };
    }
  }

  async refreshAuth(refreshToken: string): Promise<ApiResponse<AuthSession>> {
    try {
      const response = await this.requestRaw<AuthResponseDto>(`${API_V1_PREFIX}/auth/refresh`, {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
      const session = mapAuthResponse(response);
      this.setAuthToken(session.token);

      return {
        success: true,
        data: session,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refresh session',
      };
    }
  }

  async logout(): Promise<void> {
    this.clearAuth();
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const user = await this.requestRaw<AuthUserDto>(`${API_V1_PREFIX}/auth/me`);
      return {
        success: true,
        data: mapAuthUser(user),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user',
      };
    }
  }

  // Video Endpoints
  async getVideos(filters: VideoListFilters = {}): Promise<ApiResponse<PaginatedResponse<Video>>> {
    try {
      const params = new URLSearchParams();
      appendQueryParam(params, 'search', filters.search);
      appendQueryParam(params, 'categoryId', filters.categoryId);
      appendQueryParam(params, 'tagId', filters.tagId);
      appendQueryParam(params, 'uploaderId', filters.uploaderId);
      appendQueryParam(params, 'status', filters.status);
      appendQueryParam(params, 'visibility', filters.visibility);
      appendQueryParam(params, 'sort', filters.sort);
      appendQueryParam(params, 'page', filters.page ?? 1);
      appendQueryParam(params, 'pageSize', filters.pageSize ?? 24);

      const response = await this.requestRaw<PaginatedResponse<VideoSummaryDto>>(
        `${API_V1_PREFIX}/videos?${params.toString()}`
      );

      return {
        success: true,
        data: mapPagedResponse(response, mapVideoSummary),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch videos',
      };
    }
  }

  async searchVideos(query: string, filters?: Record<string, string>): Promise<ApiResponse<Video[]>> {
    try {
      const response = await this.getVideos({
        search: query,
        ...filters,
        status: 'Ready',
        visibility: 'Public',
      });

      return {
        success: response.success,
        data: response.data?.items ?? [],
        error: response.error,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Search failed',
      };
    }
  }

  async getVideoById(id: string): Promise<ApiResponse<Video>> {
    try {
      const video = await this.requestRaw<VideoDetailDto>(`${API_V1_PREFIX}/videos/${id}`);

      return {
        success: true,
        data: mapVideoDetail(video),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch video',
      };
    }
  }

  async uploadVideo(formData: FormData): Promise<ApiResponse<Video>> {
    try {
      return await this.request<Video>('/videos/upload', {
        method: 'POST',
        body: formData,
      });
    } catch (error) {
      return {
        success: false,
        error: 'Upload failed',
      };
    }
  }

  async updateVideo(id: string, data: Partial<Video>): Promise<ApiResponse<Video>> {
    try {
      return await this.request<Video>(`/videos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error) {
      return {
        success: false,
        error: 'Update failed',
      };
    }
  }

  async deleteVideo(id: string): Promise<ApiResponse<void>> {
    try {
      return await this.request<void>(`${API_V1_PREFIX}/videos/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      return {
        success: false,
        error: 'Delete failed',
      };
    }
  }

  async getVideoProcessingStatus(id: string): Promise<ApiResponse<VideoProcessingStatus>> {
    try {
      const status = await this.requestRaw<VideoProcessingStatusDto>(
        `${API_V1_PREFIX}/videos/${id}/processing-status`
      );

      return {
        success: true,
        data: mapVideoProcessingStatus(status),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch video processing status',
      };
    }
  }

  async getCategories(): Promise<ApiResponse<Category[]>> {
    try {
      const categories = await this.requestRaw<CategoryDto[]>(`${API_V1_PREFIX}/categories`);

      return {
        success: true,
        data: categories.map(mapCategory),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch categories',
      };
    }
  }

  async getTags(search?: string, page = 1, pageSize = 24): Promise<ApiResponse<PaginatedResponse<TagSummary>>> {
    try {
      const params = new URLSearchParams();
      appendQueryParam(params, 'search', search);
      appendQueryParam(params, 'page', page);
      appendQueryParam(params, 'pageSize', pageSize);

      const response = await this.requestRaw<PaginatedResponse<TagSummaryDto>>(
        `${API_V1_PREFIX}/tags?${params.toString()}`
      );

      return {
        success: true,
        data: mapPagedResponse(response, mapTagSummary),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch tags',
      };
    }
  }

  // User Management (Admin)
  async getUsers(filters: UserListFilters = {}): Promise<ApiResponse<PaginatedResponse<UserProfile>>> {
    try {
      const params = new URLSearchParams();
      appendQueryParam(params, 'search', filters.search);
      appendQueryParam(params, 'role', filters.role ? capitalize(filters.role) : undefined);
      appendQueryParam(params, 'isActive', filters.isActive);
      appendQueryParam(params, 'page', filters.page ?? 1);
      appendQueryParam(params, 'pageSize', filters.pageSize ?? 20);

      const response = await this.requestRaw<PaginatedResponse<UserProfileDto>>(
        `${API_V1_PREFIX}/users?${params.toString()}`
      );

      return {
        success: true,
        data: mapPagedResponse(response, mapUserProfile),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch users',
      };
    }
  }

  async createUser(userData: Partial<User> & { password: string }): Promise<ApiResponse<User>> {
    try {
      return await this.request<User>('/admin/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create user',
      };
    }
  }

  async updateUser(id: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      return await this.request<User>(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      });
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update user',
      };
    }
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    try {
      return await this.request<void>(`/admin/users/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete user',
      };
    }
  }

  async getVideoAccessGrants(
    videoId: string,
    filters: AccessGrantListFilters = {}
  ): Promise<ApiResponse<PaginatedResponse<AccessGrant>>> {
    try {
      const params = new URLSearchParams();
      appendQueryParam(params, 'isActive', filters.isActive);
      appendQueryParam(params, 'page', filters.page ?? 1);
      appendQueryParam(params, 'pageSize', filters.pageSize ?? 24);

      const response = await this.requestRaw<PaginatedResponse<AccessGrantDto>>(
        `${API_V1_PREFIX}/videos/${videoId}/access?${params.toString()}`
      );

      return {
        success: true,
        data: mapPagedResponse(response, mapAccessGrant),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch access grants',
      };
    }
  }

  async createVideoAccessGrant(
    videoId: string,
    data: {
      userId?: string | null;
      shareToken?: string | null;
      permissionType: AccessGrantPermission;
      expiresAt?: string | null;
    }
  ): Promise<ApiResponse<AccessGrant>> {
    try {
      const grant = await this.requestRaw<AccessGrantDto>(`${API_V1_PREFIX}/videos/${videoId}/access`, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      return {
        success: true,
        data: mapAccessGrant(grant),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create access grant',
      };
    }
  }

  async deleteVideoAccessGrant(videoId: string, accessControlId: string): Promise<ApiResponse<void>> {
    try {
      await this.requestRaw<void>(`${API_V1_PREFIX}/videos/${videoId}/access/${accessControlId}`, {
        method: 'DELETE',
      });

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete access grant',
      };
    }
  }

  async getReactionSummary(videoId: string): Promise<ApiResponse<ReactionSummary>> {
    try {
      const summary = await this.requestRaw<ReactionSummaryDto>(`${API_V1_PREFIX}/videos/${videoId}/reactions/summary`);

      return {
        success: true,
        data: mapReactionSummary(summary),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch reaction summary',
      };
    }
  }

  async setReaction(videoId: string, data: SetReactionRequest): Promise<ApiResponse<ReactionSummary>> {
    try {
      const summary = await this.requestRaw<ReactionSummaryDto>(`${API_V1_PREFIX}/videos/${videoId}/reaction`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      return {
        success: true,
        data: mapReactionSummary(summary),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update reaction',
      };
    }
  }

  async clearReaction(videoId: string): Promise<ApiResponse<ReactionSummary>> {
    try {
      const summary = await this.requestRaw<ReactionSummaryDto>(`${API_V1_PREFIX}/videos/${videoId}/reaction`, {
        method: 'DELETE',
      });

      return {
        success: true,
        data: mapReactionSummary(summary),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to clear reaction',
      };
    }
  }

  async getComments(videoId: string, filters: CommentListFilters = {}): Promise<ApiResponse<PaginatedResponse<Comment>>> {
    try {
      const params = new URLSearchParams();
      appendQueryParam(params, 'parentCommentId', filters.parentCommentId);
      appendQueryParam(params, 'page', filters.page ?? 1);
      appendQueryParam(params, 'pageSize', filters.pageSize ?? 24);

      const response = await this.requestRaw<PaginatedResponse<CommentDto>>(
        `${API_V1_PREFIX}/videos/${videoId}/comments?${params.toString()}`
      );

      return {
        success: true,
        data: mapPagedResponse(response, mapComment),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch comments',
      };
    }
  }

  async createComment(videoId: string, data: CreateCommentRequest): Promise<ApiResponse<Comment>> {
    try {
      const comment = await this.requestRaw<CommentDto>(`${API_V1_PREFIX}/videos/${videoId}/comments`, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      return {
        success: true,
        data: mapComment(comment),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create comment',
      };
    }
  }

  async updateComment(videoId: string, commentId: string, data: UpdateCommentRequest): Promise<ApiResponse<Comment>> {
    try {
      const comment = await this.requestRaw<CommentDto>(`${API_V1_PREFIX}/videos/${videoId}/comments/${commentId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });

      return {
        success: true,
        data: mapComment(comment),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update comment',
      };
    }
  }

  async deleteComment(videoId: string, commentId: string): Promise<ApiResponse<void>> {
    try {
      await this.requestRaw<void>(`${API_V1_PREFIX}/videos/${videoId}/comments/${commentId}`, {
        method: 'DELETE',
      });

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete comment',
      };
    }
  }

  async getVideoBookmarks(
    videoId: string,
    filters: Omit<BookmarkListFilters, 'videoId'> = {}
  ): Promise<ApiResponse<PaginatedResponse<VideoBookmark>>> {
    try {
      const params = new URLSearchParams();
      appendQueryParam(params, 'page', filters.page ?? 1);
      appendQueryParam(params, 'pageSize', filters.pageSize ?? 24);

      const response = await this.requestRaw<PaginatedResponse<BookmarkDto>>(
        `${API_V1_PREFIX}/videos/${videoId}/bookmarks?${params.toString()}`
      );

      return {
        success: true,
        data: mapPagedResponse(response, mapBookmark),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch video bookmarks',
      };
    }
  }

  async createBookmark(videoId: string, data: CreateBookmarkRequest): Promise<ApiResponse<VideoBookmark>> {
    try {
      const bookmark = await this.requestRaw<BookmarkDto>(`${API_V1_PREFIX}/videos/${videoId}/bookmarks`, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      return {
        success: true,
        data: mapBookmark(bookmark),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create bookmark',
      };
    }
  }

  async updateBookmark(
    videoId: string,
    bookmarkId: string,
    data: UpdateBookmarkRequest
  ): Promise<ApiResponse<VideoBookmark>> {
    try {
      const bookmark = await this.requestRaw<BookmarkDto>(`${API_V1_PREFIX}/videos/${videoId}/bookmarks/${bookmarkId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });

      return {
        success: true,
        data: mapBookmark(bookmark),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update bookmark',
      };
    }
  }

  async deleteBookmark(videoId: string, bookmarkId: string): Promise<ApiResponse<void>> {
    try {
      await this.requestRaw<void>(`${API_V1_PREFIX}/videos/${videoId}/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
      });

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete bookmark',
      };
    }
  }

  async getMyBookmarks(filters: BookmarkListFilters = {}): Promise<ApiResponse<PaginatedResponse<VideoBookmark>>> {
    try {
      const params = new URLSearchParams();
      appendQueryParam(params, 'videoId', filters.videoId);
      appendQueryParam(params, 'page', filters.page ?? 1);
      appendQueryParam(params, 'pageSize', filters.pageSize ?? 24);

      const response = await this.requestRaw<PaginatedResponse<BookmarkDto>>(
        `${API_V1_PREFIX}/me/bookmarks?${params.toString()}`
      );

      return {
        success: true,
        data: mapPagedResponse(response, mapBookmark),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch bookmarks',
      };
    }
  }

  // Analytics Endpoints
  async getAnalytics(startDate: Date, endDate: Date): Promise<ApiResponse<VideoAnalytics[]>> {
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      return await this.request<VideoAnalytics[]>(`/admin/analytics?${params.toString()}`);
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch analytics',
      };
    }
  }

  // Playlist Endpoints
  async getPlaylists(): Promise<ApiResponse<Playlist[]>> {
    try {
      return await this.request<Playlist[]>('/playlists');
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch playlists',
      };
    }
  }

  async createPlaylist(data: Partial<Playlist>): Promise<ApiResponse<Playlist>> {
    try {
      return await this.request<Playlist>('/playlists', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create playlist',
      };
    }
  }

  async addVideoToPlaylist(playlistId: string, videoId: string): Promise<ApiResponse<Playlist>> {
    try {
      return await this.request<Playlist>(`/playlists/${playlistId}/videos`, {
        method: 'POST',
        body: JSON.stringify({ videoId }),
      });
    } catch (error) {
      return {
        success: false,
        error: 'Failed to add video to playlist',
      };
    }
  }

  // Notification Endpoints
  async getNotifications(filters: NotificationListFilters = {}): Promise<ApiResponse<PaginatedResponse<Notification>>> {
    try {
      const params = new URLSearchParams();
      appendQueryParam(params, 'isRead', filters.isRead);
      appendQueryParam(params, 'page', filters.page ?? 1);
      appendQueryParam(params, 'pageSize', filters.pageSize ?? 24);

      const response = await this.requestRaw<PaginatedResponse<NotificationDto>>(
        `${API_V1_PREFIX}/me/notifications?${params.toString()}`
      );

      return {
        success: true,
        data: mapPagedResponse(response, mapNotification),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch notifications',
      };
    }
  }

  async getUnreadNotificationCount(): Promise<ApiResponse<UnreadNotificationCount>> {
    try {
      const response = await this.requestRaw<UnreadNotificationCountDto>(`${API_V1_PREFIX}/me/notifications/unread-count`);

      return {
        success: true,
        data: mapUnreadNotificationCount(response),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch unread notification count',
      };
    }
  }

  async markNotificationAsRead(id: string): Promise<ApiResponse<void>> {
    try {
      await this.requestRaw<void>(`${API_V1_PREFIX}/me/notifications/${id}/read`, {
        method: 'POST',
      });

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to mark notification as read',
      };
    }
  }

  async markNotificationAsUnread(id: string): Promise<ApiResponse<void>> {
    try {
      await this.requestRaw<void>(`${API_V1_PREFIX}/me/notifications/${id}/unread`, {
        method: 'POST',
      });

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to mark notification as unread',
      };
    }
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<void>> {
    try {
      await this.requestRaw<void>(`${API_V1_PREFIX}/me/notifications/mark-all-read`, {
        method: 'POST',
      });

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to mark all notifications as read',
      };
    }
  }

  async deleteNotification(id: string): Promise<ApiResponse<void>> {
    try {
      await this.requestRaw<void>(`${API_V1_PREFIX}/me/notifications/${id}`, {
        method: 'DELETE',
      });

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete notification',
      };
    }
  }

  async clearReadNotifications(): Promise<ApiResponse<void>> {
    try {
      await this.requestRaw<void>(`${API_V1_PREFIX}/me/notifications/read`, {
        method: 'DELETE',
      });

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to clear read notifications',
      };
    }
  }

  // Owned Videos (Editor) Endpoints
  async getOwnedVideos(filters: VideoListFilters = {}): Promise<ApiResponse<PaginatedResponse<Video>>> {
    try {
      const params = new URLSearchParams();
      appendQueryParam(params, 'search', filters.search);
      appendQueryParam(params, 'status', filters.status);
      appendQueryParam(params, 'visibility', filters.visibility);
      appendQueryParam(params, 'sort', filters.sort);
      appendQueryParam(params, 'page', filters.page ?? 1);
      appendQueryParam(params, 'pageSize', filters.pageSize ?? 24);

      const response = await this.requestRaw<PaginatedResponse<VideoSummaryDto>>(
        `${API_V1_PREFIX}/me/videos?${params.toString()}`
      );

      return {
        success: true,
        data: mapPagedResponse(response, mapVideoSummary),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch your videos',
      };
    }
  }

  async updateVideoMetadata(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      visibility: string;
      categories: string[];
      tags: string[];
      allowComments: boolean;
      allowLikes: boolean;
      allowBookmarks: boolean;
    }>
  ): Promise<ApiResponse<Video>> {
    try {
      const video = await this.requestRaw<VideoDetailDto>(
        `${API_V1_PREFIX}/videos/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        }
      );

      return {
        success: true,
        data: mapVideoDetail(video),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update video metadata',
      };
    }
  }

  async archiveVideo(id: string): Promise<ApiResponse<void>> {
    try {
      await this.requestRaw<void>(
        `${API_V1_PREFIX}/videos/${id}/archive`,
        {
          method: 'POST',
        }
      );

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to archive video',
      };
    }
  }
}

export const apiClient = new ApiClient();
