import { AuthResponseDto, AuthSession, AuthUserDto, User, UserRole } from '@/features/auth/types';
import {
  Category,
  CategoryDto,
  TagSummary,
  TagSummaryDto,
  Video,
  VideoDetailDto,
  VideoListFilters,
  VideoProcessingStatus,
  VideoProcessingStatusDto,
  VideoSummaryDto,
} from '@/features/videos/types';
import { Playlist } from '@/features/playlists/types';
import { Notification } from '@/features/notifications/types';
import { VideoAnalytics } from '@/features/admin/types';
import { ApiResponse, PaginatedResponse } from '@/shared/types/api';
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

const appendQueryParam = (params: URLSearchParams, key: string, value: string | number | undefined) => {
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
  async getUsers(page: number = 1, pageSize: number = 20): Promise<ApiResponse<PaginatedResponse<User>>> {
    try {
      return await this.request<PaginatedResponse<User>>(`/admin/users?page=${page}&pageSize=${pageSize}`);
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
  async getNotifications(): Promise<ApiResponse<Notification[]>> {
    try {
      return await this.request<Notification[]>('/notifications');
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch notifications',
      };
    }
  }

  async markNotificationAsRead(id: string): Promise<ApiResponse<void>> {
    try {
      return await this.request<void>(`/notifications/${id}/read`, {
        method: 'PUT',
      });
    } catch (error) {
      return {
        success: false,
        error: 'Failed to mark notification as read',
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
