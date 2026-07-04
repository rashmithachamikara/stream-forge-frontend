export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  uploadedBy: string;
  uploadedAt: Date;
  uploaderId?: string;
  views: number;
  categories: string[];
  tags: string[];
  tagDetails?: TagSummary[];
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

export type ReactionType = 'Like' | 'Dislike';

export interface ReactionSummary {
  videoId: string;
  likeCount: number;
  dislikeCount: number;
  currentUserReaction: ReactionType | null;
}

export interface ReactionSummaryDto {
  videoId?: string;
  likeCount?: number;
  dislikeCount?: number;
  currentUserReaction?: ReactionType | null;
}

export interface SetReactionRequest {
  reactionType: ReactionType;
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

export interface CreateCategoryRequest {
  name: string;
  description?: string | null;
  parentCategoryId?: string | null;
  displayOrder: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string | null;
  parentCategoryId?: string | null;
  clearParentCategory?: boolean;
  displayOrder?: number | null;
  clearDescription?: boolean;
}

export interface TagSummary {
  id: string;
  name: string;
  usageCount: number;
}

export interface CreateTagRequest {
  name: string;
}

export interface UpdateTagRequest {
  name?: string;
}

export interface TagSummaryDto {
  id?: string;
  name?: string | null;
  usageCount?: number;
}

export interface VideoListFilters {
  search?: string;
  categoryId?: string;
  tagId?: string;
  uploaderId?: string;
  excludeUploaderId?: string;
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
  durationSeconds?: number | null;
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

export interface Comment {
  id: string;
  videoId: string;
  userId: string;
  userName: string;
  parentCommentId: string | null;
  comment: string;
  replyCount: number;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentDto {
  id?: string;
  videoId?: string;
  userId?: string;
  userName?: string | null;
  parentCommentId?: string | null;
  comment?: string | null;
  replyCount?: number;
  isEdited?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommentListFilters {
  parentCommentId?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateCommentRequest {
  comment: string;
  parentCommentId?: string | null;
}

export interface UpdateCommentRequest {
  comment: string;
}

export interface CategoryDto {
  id?: string;
  name?: string | null;
  description?: string | null;
  parentCategoryId?: string | null;
  displayOrder?: number;
  createdAt?: string;
}

export type AccessGrantPermission = 'View' | 'Embed' | 'Download';

export interface AccessGrant {
  id: string;
  videoId: string;
  userId: string | null;
  userName: string | null;
  shareToken: string | null;
  permissionType: AccessGrantPermission;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
}

export interface AccessGrantDto {
  id?: string;
  videoId?: string;
  userId?: string | null;
  userName?: string | null;
  shareToken?: string | null;
  permissionType?: AccessGrantPermission;
  expiresAt?: string | null;
  isActive?: boolean;
  createdAt?: string;
}

export interface AccessGrantListFilters {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
}

export interface VideoBookmark {
  id: string;
  videoId: string;
  timestampSeconds: number;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  video: Video | null;
}

export interface BookmarkDto {
  id?: string;
  videoId?: string;
  timestampSeconds?: number;
  note?: string | null;
  createdAt?: string;
  updatedAt?: string;
  video?: VideoSummaryDto | null;
}

export interface BookmarkListFilters {
  videoId?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateBookmarkRequest {
  timestampSeconds: number;
  note?: string | null;
}

export interface UpdateBookmarkRequest {
  timestampSeconds: number;
  note?: string | null;
}

export type PersistedTranscriptionStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed';
export type TranscriptionUiStatus = 'active' | 'success' | 'failure' | 'mixed';

export interface TranscriptionLiveStatus {
  status: string | null;
  progressPercent: number;
  stage: string | null;
  message: string | null;
  language: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  mediaDurationSeconds: number | null;
  transcribedUntilSeconds: number | null;
}

export interface TranscriptionLiveStatusDto {
  status?: string | null;
  progressPercent?: number;
  stage?: string | null;
  message?: string | null;
  language?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  mediaDurationSeconds?: number | null;
  transcribedUntilSeconds?: number | null;
}

export interface VideoTranscription {
  id: string;
  videoId: string;
  language: string | null;
  format: string | null;
  status: string | null;
  source: string | null;
  correlationId: string | null;
  workerJobId: string | null;
  model: string | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  liveStatus: TranscriptionLiveStatus | null;
}

export interface VideoTranscriptionDto {
  id?: string;
  videoId?: string;
  language?: string | null;
  format?: string | null;
  status?: string | null;
  source?: string | null;
  correlationId?: string | null;
  workerJobId?: string | null;
  model?: string | null;
  failureReason?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
  liveStatus?: TranscriptionLiveStatusDto | null;
}

export interface VideoTranscriptionArtifact {
  id: string;
  format: string | null;
  status: string | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface VideoTranscriptionArtifactDto {
  id?: string;
  format?: string | null;
  status?: string | null;
  failureReason?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface VideoTranscriptionJob {
  jobKey: string | null;
  videoId: string;
  videoTitle: string | null;
  language: string | null;
  status: string | null;
  source: string | null;
  correlationId: string | null;
  workerJobId: string | null;
  model: string | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  liveStatus: TranscriptionLiveStatus | null;
  artifacts: VideoTranscriptionArtifact[];
}

export interface VideoTranscriptionJobDto {
  jobKey?: string | null;
  videoId?: string;
  videoTitle?: string | null;
  language?: string | null;
  status?: string | null;
  source?: string | null;
  correlationId?: string | null;
  workerJobId?: string | null;
  model?: string | null;
  failureReason?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
  liveStatus?: TranscriptionLiveStatusDto | null;
  artifacts?: VideoTranscriptionArtifactDto[] | null;
}

export interface TranscriptChunk {
  chunkId: string;
  videoId: string;
  transcriptionId: string;
  language: string | null;
  startSeconds: number;
  endSeconds: number;
  content: string | null;
}

export interface TranscriptChunkDto {
  chunkId?: string;
  videoId?: string;
  transcriptionId?: string;
  language?: string | null;
  startSeconds?: number;
  endSeconds?: number;
  content?: string | null;
}

export interface TranscriptSearchResult {
  chunkId: string;
  videoId: string;
  transcriptionId: string;
  language: string | null;
  startSeconds: number;
  endSeconds: number;
  content: string | null;
}

export interface TranscriptSearchResultDto {
  chunkId?: string;
  videoId?: string;
  transcriptionId?: string;
  language?: string | null;
  startSeconds?: number;
  endSeconds?: number;
  content?: string | null;
}

export interface TranscriptSearchFilters {
  q?: string;
  language?: string;
  page?: number;
  pageSize?: number;
  shareToken?: string;
}

export interface RequestVideoTranscriptionRequest {
  language?: string | null;
  outputFormats?: string[] | null;
}

export interface RequestVideoTranscriptionRequestDto {
  language?: string | null;
  outputFormats?: string[] | null;
}

export interface TranscriptionArtifactFile {
  blob: Blob;
  contentType: string | null;
}

export interface TranscriptionArtifactText {
  content: string;
  contentType: string | null;
}

export interface GroundedQuestionCitation {
  videoId: string;
  videoTitle: string | null;
  transcriptionId: string;
  chunkId: string;
  startSeconds: number;
  endSeconds: number;
  content: string | null;
}

export interface GroundedQuestionCitationDto {
  videoId?: string;
  videoTitle?: string | null;
  transcriptionId?: string;
  chunkId?: string;
  startSeconds?: number;
  endSeconds?: number;
  content?: string | null;
}

export interface GroundedQuestionAnswer {
  question: string | null;
  retrievalMode: string | null;
  answer: string | null;
  usedChunkCount: number;
  citations: GroundedQuestionCitation[] | null;
}

export interface GroundedQuestionAnswerDto {
  question?: string | null;
  retrievalMode?: string | null;
  answer?: string | null;
  usedChunkCount?: number;
  citations?: GroundedQuestionCitationDto[] | null;
}

export interface AskVideoQuestionRequest {
  question: string | null;
  language?: string | null;
}

export interface AskVideoQuestionRequestDto {
  question?: string | null;
  language?: string | null;
}

export interface AskQuestionAcrossVideosRequest {
  question: string | null;
  language?: string | null;
  videoIds?: string[] | null;
}

export interface AskQuestionAcrossVideosRequestDto {
  question?: string | null;
  language?: string | null;
  videoIds?: string[] | null;
}

