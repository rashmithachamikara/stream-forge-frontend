import { AuthResponseDto, AuthSession, AuthUserDto, User, UserRole } from '@/features/auth/types';
import { Video } from '@/features/videos/types';
import { Playlist } from '@/features/playlists/types';
import { Notification } from '@/features/notifications/types';
import { VideoAnalytics } from '@/features/admin/types';
import { ApiResponse, PaginatedResponse } from '@/shared/types/api';

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
  async getVideos(page: number = 1, pageSize: number = 20): Promise<ApiResponse<PaginatedResponse<Video>>> {
    try {
      return await this.request<PaginatedResponse<Video>>(`/videos?page=${page}&pageSize=${pageSize}`);
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch videos',
      };
    }
  }

  async searchVideos(query: string, filters?: Record<string, string>): Promise<ApiResponse<Video[]>> {
    try {
      const params = new URLSearchParams({ q: query, ...filters });
      return await this.request<Video[]>(`/videos/search?${params.toString()}`);
    } catch (error) {
      return {
        success: false,
        error: 'Search failed',
      };
    }
  }

  async getVideoById(id: string): Promise<ApiResponse<Video>> {
    try {
      return await this.request<Video>(`/videos/${id}`);
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
      return await this.request<void>(`/videos/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      return {
        success: false,
        error: 'Delete failed',
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
}

export const apiClient = new ApiClient();
