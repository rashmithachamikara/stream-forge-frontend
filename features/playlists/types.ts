import { Video, VideoSummaryDto } from '@/features/videos/types';
import { PaginatedResponse } from '@/shared/types/api';

export type PlaylistVisibility = 'Public' | 'Private';

export interface Playlist {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  visibility: PlaylistVisibility;
  videoCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaylistDto {
  id?: string;
  name?: string | null;
  description?: string | null;
  ownerId?: string;
  ownerName?: string | null;
  visibility?: PlaylistVisibility;
  videoCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlaylistListFilters {
  ownerId?: string;
  page?: number;
  pageSize?: number;
}

export interface CreatePlaylistRequest {
  name: string;
  description?: string;
  visibility: PlaylistVisibility;
}

export interface UpdatePlaylistRequest {
  name?: string;
  description?: string;
  visibility?: PlaylistVisibility;
}

export interface AddPlaylistVideoRequest {
  videoId: string;
  orderIndex?: number | null;
}

export interface ReorderPlaylistVideosRequest {
  videoIds: string[];
}

export interface PlaylistVideosPage {
  playlist: Playlist;
  videos: PaginatedResponse<Video>;
}

export interface PlaylistVideosPageDto {
  playlist?: PlaylistDto;
  videos?: PaginatedResponse<VideoSummaryDto>;
}
