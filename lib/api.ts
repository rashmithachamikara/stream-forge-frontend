import axios, { AxiosInstance } from 'axios';
import { User, ApiResponse, PaginatedResponse, Video, Playlist, Notification, VideoAnalytics } from '@/types';

// Mock API base URL - replace with actual API endpoint
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.streamforge.local';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
      if (this.token) {
        this.setAuthToken(this.token);
      }
    }

    // Add response interceptor for token refresh
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired - clear and redirect to login
          this.clearAuth();
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string) {
    this.token = token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearAuth() {
    this.token = null;
    delete this.client.defaults.headers.common['Authorization'];
    localStorage.removeItem('authToken');
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
      const response = await this.client.get('/auth/me');
      return response.data;
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
      const response = await this.client.get(`/videos?page=${page}&pageSize=${pageSize}`);
      return response.data;
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
      const response = await this.client.get(`/videos/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: 'Search failed',
      };
    }
  }

  async getVideoById(id: string): Promise<ApiResponse<Video>> {
    try {
      const response = await this.client.get(`/videos/${id}`);
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch video',
      };
    }
  }

  async uploadVideo(formData: FormData): Promise<ApiResponse<Video>> {
    try {
      const response = await this.client.post('/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: 'Upload failed',
      };
    }
  }

  async updateVideo(id: string, data: Partial<Video>): Promise<ApiResponse<Video>> {
    try {
      const response = await this.client.put(`/videos/${id}`, data);
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: 'Update failed',
      };
    }
  }

  async deleteVideo(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.delete(`/videos/${id}`);
      return response.data;
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
      const response = await this.client.get(`/admin/users?page=${page}&pageSize=${pageSize}`);
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch users',
      };
    }
  }

  async createUser(userData: Partial<User> & { password: string }): Promise<ApiResponse<User>> {
    try {
      const response = await this.client.post('/admin/users', userData);
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create user',
      };
    }
  }

  async updateUser(id: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await this.client.put(`/admin/users/${id}`, userData);
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update user',
      };
    }
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.delete(`/admin/users/${id}`);
      return response.data;
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
      const response = await this.client.get('/admin/analytics', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
      return response.data;
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
      const response = await this.client.get('/playlists');
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch playlists',
      };
    }
  }

  async createPlaylist(data: Partial<Playlist>): Promise<ApiResponse<Playlist>> {
    try {
      const response = await this.client.post('/playlists', data);
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create playlist',
      };
    }
  }

  async addVideoToPlaylist(playlistId: string, videoId: string): Promise<ApiResponse<Playlist>> {
    try {
      const response = await this.client.post(`/playlists/${playlistId}/videos`, { videoId });
      return response.data;
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
      const response = await this.client.get('/notifications');
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch notifications',
      };
    }
  }

  async markNotificationAsRead(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.put(`/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to mark notification as read',
      };
    }
  }
}

export const apiClient = new ApiClient();
