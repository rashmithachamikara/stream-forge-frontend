import { User } from '@/features/auth/types';
import { Video } from '@/features/videos/types';
import { Playlist } from '@/features/playlists/types';
import { Notification } from '@/features/notifications/types';
import { VideoAnalytics } from '@/features/admin/types';
import { ApiResponse, PaginatedResponse } from '@/shared/types/api';

// Mock API base URL - replace with actual API endpoint
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.streamforge.local';

class ApiClient {
  private token: string | null = null;

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

  private async request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const isFormData = options.body instanceof FormData;
    const headers = new Headers(options.headers);

    if (!isFormData && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.clearAuth();
    }

    const data = await response.json().catch(() => undefined);

    if (!response.ok) {
      return {
        success: false,
        error: data?.error || data?.message || 'Request failed',
      };
    }

    return data;
  }

  // Authentication Endpoints
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    // Mock login for demo purposes
    const mockUsers: Record<string, { user: User; password: string }> = {
      'admin@streamforge.com': {
        password: 'password',
        user: {
          id: '1',
          email: 'admin@streamforge.com',
          name: 'Admin User',
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      'editor@streamforge.com': {
        password: 'password',
        user: {
          id: '2',
          email: 'editor@streamforge.com',
          name: 'Editor User',
          role: 'editor',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      'viewer@streamforge.com': {
        password: 'password',
        user: {
          id: '3',
          email: 'viewer@streamforge.com',
          name: 'Viewer User',
          role: 'viewer',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    };

    const mockUser = mockUsers[email];
    if (mockUser && mockUser.password === password) {
      // Generate a mock token
      const token = `mock_token_${btoa(email)}_${Date.now()}`;
      return {
        success: true,
        data: {
          user: mockUser.user,
          token,
        },
      };
    }

    return {
      success: false,
      error: 'Invalid email or password',
    };
  }

  async logout(): Promise<void> {
    // Mock logout - no API call needed since this is a demo
    this.clearAuth();
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      return await this.request<User>('/auth/me');
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch user',
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
