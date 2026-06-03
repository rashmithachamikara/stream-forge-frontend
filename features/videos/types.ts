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
  visibility: VideoVisibility;
  hlsUrl: string;
  transcriptUrl?: string;
  transcodedVersions: TranscodedVersion[];
  categoryId?: string | null;
  status?: VideoStatus;
  updatedAt?: Date;
  allowComments?: boolean;
  allowLikes?: boolean;
  allowBookmarks?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  defaultVolume?: number;
  captionsEnabled?: boolean;
  playerTheme?: string | null;
}

export interface TranscodedVersion {
  resolution: string;
  format: string;
  bitrate: string;
  url: string;
}

export type VideoVisibility = 'public' | 'private' | 'internal' | 'restricted';

export type VideoStatus = 'Uploading' | 'Processing' | 'Ready' | 'Failed' | 'Deleted';

export interface Category {
  id: string;
  name: string;
  description: string;
  parentCategoryId: string | null;
  displayOrder: number;
  createdAt: Date;
}

export interface TagSummary {
  id: string;
  name: string;
  usageCount: number;
}

export interface VideoListFilters {
  search?: string;
  categoryId?: string;
  tagId?: string;
  uploaderId?: string;
  status?: VideoStatus;
  visibility?: 'Public' | 'Private' | 'Internal';
  sort?: string;
  page?: number;
  pageSize?: number;
}

export interface VideoSummaryDto {
  id?: string;
  title?: string | null;
  description?: string | null;
  uploaderId?: string;
  uploaderName?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  visibility?: 'Public' | 'Private' | 'Internal';
  status?: VideoStatus;
  viewCount?: number;
  createdAt?: string;
  updatedAt?: string;
  thumbnailUrl?: string | null;
  playbackManifestUrl?: string | null;
  tags?: TagSummaryDto[] | null;
}

export interface VideoDetailDto extends VideoSummaryDto {
  allowComments?: boolean;
  allowLikes?: boolean;
  allowBookmarks?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  defaultVolume?: number;
  captionsEnabled?: boolean;
  playerTheme?: string | null;
}

export interface VideoProcessingStatus {
  videoId: string;
  videoStatus: VideoStatus;
  processingJobId: string | null;
  jobType: string;
  jobStatus: string;
  progress: number | null;
  errorMessage: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface VideoProcessingStatusDto {
  videoId?: string;
  videoStatus?: VideoStatus;
  processingJobId?: string | null;
  jobType?: string | null;
  jobStatus?: string | null;
  progress?: number | null;
  errorMessage?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface CategoryDto {
  id?: string;
  name?: string | null;
  description?: string | null;
  parentCategoryId?: string | null;
  displayOrder?: number;
  createdAt?: string;
}

export interface TagSummaryDto {
  id?: string;
  name?: string | null;
  usageCount?: number;
}
