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
  CreateCategoryRequest,
  CreateBookmarkRequest,
  CreateCommentRequest,
  CreateTagRequest,
  RequestVideoTranscriptionRequest,
  ReactionSummary,
  ReactionSummaryDto,
  SetReactionRequest,
  TagSummaryDto,
  TagSummary,
  TranscriptChunk,
  TranscriptChunkDto,
  TranscriptSearchFilters,
  TranscriptSearchResult,
  TranscriptSearchResultDto,
  TranscriptionArtifactFile,
  TranscriptionArtifactText,
  TranscriptionLiveStatus,
  TranscriptionLiveStatusDto,
  UpdateCategoryRequest,
  UpdateBookmarkRequest,
  UpdateCommentRequest,
  UpdateTagRequest,
  Video,
  VideoDetailDto,
  VideoBookmark,
  VideoListFilters,
  VideoProcessingStatus,
  VideoProcessingStatusDto,
  VideoTranscription,
  VideoTranscriptionDto,
  VideoTranscriptionJob,
  VideoTranscriptionJobDto,
  VideoSummaryDto,
  GroundedQuestionAnswer,
  GroundedQuestionAnswerDto,
  GroundedQuestionCitation,
  GroundedQuestionCitationDto,
  AskVideoQuestionRequest,
  AskQuestionAcrossVideosRequest,
} from '@/features/videos/types';
import {
  ActiveViewers,
  ActiveViewersDto,
  AdminTranscriptionSettings,
  AdminTranscriptionSettingsDto,
  AdminVideoProcessingJob,
  AdminVideoProcessingJobDto,
  AnalyticsBreakdownItem,
  AnalyticsBreakdownKind,
  AnalyticsDateRange,
  AnalyticsSummary,
  AnalyticsSummaryDto,
  AnalyticsTimeSeriesPoint,
  AnalyticsTimeSeriesPointDto,
  AnalyticsEngagementSummary,
  AnalyticsEngagementSummaryDto,
  AuthBreakdown,
  AuthBreakdownDto,
  BrowserBreakdownItemDto,
  CategoryBreakdownItemDto,
  DeviceBreakdownItemDto,
  PeakWatchTimeItem,
  PeakWatchTimeItemDto,
  RankedAnalyticsKind,
  RankedVideoAnalytics,
  RankedVideoAnalyticsDto,
  RecordAnalyticsEventRequest,
  RecordAnalyticsEventResult,
  RecordAnalyticsEventResultDto,
  TagBreakdownItemDto,
  UpdateAdminTranscriptionSettingsRequest,
  UserListFilters,
  UserProfile,
  UserProfileDto,
  AdminRagSettings,
  AdminRagSettingsDto,
  SystemSecretStatus,
  SystemSecretStatusDto,
  UpdateAdminRagSettingsRequest,
  QaProviderModelCatalog,
  QaProviderModelCatalogDto,
} from '@/features/admin/types';
import {
  AddPlaylistVideoRequest,
  CreatePlaylistRequest,
  Playlist,
  PlaylistDto,
  PlaylistListFilters,
  PlaylistVideosPage,
  PlaylistVideosPageDto,
  ReorderPlaylistVideosRequest,
  UpdatePlaylistRequest,
} from '@/features/playlists/types';
import {
  Notification,
  NotificationDto,
  NotificationListFilters,
  UnreadNotificationCount,
  UnreadNotificationCountDto,
} from '@/features/notifications/types';
import { ApiResponse, PaginatedResponse } from '@/shared/types/api';
import { capitalize } from '@/shared/lib/utils';
import { getVideoManifestUrl, getVideoThumbnailUrl } from '@/features/videos/lib/playbackUrls';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.streamforge.local';
const API_V1_PREFIX = '/api/v1';
const ANALYTICS_API_BASE_URL = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT_BASE_URL || API_BASE_URL;
const ANALYTICS_INGESTION_ENABLED = process.env.NEXT_PUBLIC_ANALYTICS_INGESTION_ENABLED !== 'false';
const ANALYTICS_SEND_ANONYMOUS = process.env.NEXT_PUBLIC_ANALYTICS_SEND_ANONYMOUS !== 'false';

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
    duration: video.durationSeconds ?? 0,
    uploadedBy: video.uploaderName ?? 'Unknown uploader',
    uploadedAt: video.createdAt ? new Date(video.createdAt) : new Date(),
    views: video.viewCount ?? 0,
    categories: categoryNames,
    tags: tags.map((tag) => tag.name),
    tagDetails: tags,
    visibility: normalizeVideoVisibility(video.visibility),
    hlsUrl: resolveApiUrl(video.playbackManifestUrl) || getVideoManifestUrl(videoId),
    transcodedVersions: [],
    categoryId: video.categoryId ?? null,
    status: video.status,
    updatedAt: video.updatedAt ? new Date(video.updatedAt) : undefined,
    uploaderId: video.uploaderId,
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

const mapTranscriptionLiveStatus = (
  status: TranscriptionLiveStatusDto | null | undefined
): TranscriptionLiveStatus | null => {
  if (!status) {
    return null;
  }

  return {
    status: status.status ?? null,
    progressPercent: status.progressPercent ?? 0,
    stage: status.stage ?? null,
    message: status.message ?? null,
    language: status.language ?? null,
    startedAt: status.startedAt ? new Date(status.startedAt) : null,
    completedAt: status.completedAt ? new Date(status.completedAt) : null,
    mediaDurationSeconds: status.mediaDurationSeconds ?? null,
    transcribedUntilSeconds: status.transcribedUntilSeconds ?? null,
  };
};

const mapVideoTranscription = (transcription: VideoTranscriptionDto): VideoTranscription => ({
  id: transcription.id ?? '',
  videoId: transcription.videoId ?? '',
  language: transcription.language ?? null,
  format: transcription.format ?? null,
  status: transcription.status ?? null,
  source: transcription.source ?? null,
  correlationId: transcription.correlationId ?? null,
  workerJobId: transcription.workerJobId ?? null,
  model: transcription.model ?? null,
  failureReason: transcription.failureReason ?? null,
  createdAt: transcription.createdAt ? new Date(transcription.createdAt) : new Date(),
  updatedAt: transcription.updatedAt ? new Date(transcription.updatedAt) : null,
  liveStatus: mapTranscriptionLiveStatus(transcription.liveStatus),
});

const mapVideoTranscriptionJob = (job: VideoTranscriptionJobDto): VideoTranscriptionJob => ({
  jobKey: job.jobKey ?? null,
  videoId: job.videoId ?? '',
  videoTitle: job.videoTitle ?? null,
  language: job.language ?? null,
  status: job.status ?? null,
  source: job.source ?? null,
  correlationId: job.correlationId ?? null,
  workerJobId: job.workerJobId ?? null,
  model: job.model ?? null,
  failureReason: job.failureReason ?? null,
  createdAt: job.createdAt ? new Date(job.createdAt) : new Date(),
  updatedAt: job.updatedAt ? new Date(job.updatedAt) : null,
  liveStatus: mapTranscriptionLiveStatus(job.liveStatus),
  artifacts: (job.artifacts ?? []).map((artifact) => ({
    id: artifact.id ?? '',
    format: artifact.format ?? null,
    status: artifact.status ?? null,
    failureReason: artifact.failureReason ?? null,
    createdAt: artifact.createdAt ? new Date(artifact.createdAt) : new Date(),
    updatedAt: artifact.updatedAt ? new Date(artifact.updatedAt) : null,
  })),
});

const mapTranscriptChunk = (chunk: TranscriptChunkDto): TranscriptChunk => ({
  chunkId: chunk.chunkId ?? '',
  videoId: chunk.videoId ?? '',
  transcriptionId: chunk.transcriptionId ?? '',
  language: chunk.language ?? null,
  startSeconds: chunk.startSeconds ?? 0,
  endSeconds: chunk.endSeconds ?? 0,
  content: chunk.content ?? null,
});

const mapTranscriptSearchResult = (result: TranscriptSearchResultDto): TranscriptSearchResult => ({
  chunkId: result.chunkId ?? '',
  videoId: result.videoId ?? '',
  transcriptionId: result.transcriptionId ?? '',
  language: result.language ?? null,
  startSeconds: result.startSeconds ?? 0,
  endSeconds: result.endSeconds ?? 0,
  content: result.content ?? null,
});

const mapSystemSecretStatus = (status?: SystemSecretStatusDto | null): SystemSecretStatus => ({
  isConfigured: status?.isConfigured ?? false,
  maskedValue: status?.maskedValue ?? null,
});

const mapQaProviderModelCatalog = (
  catalog?: QaProviderModelCatalogDto | null
): QaProviderModelCatalog => ({
  provider: catalog?.provider ?? null,
  defaultModel: catalog?.defaultModel ?? null,
  models: catalog?.models ?? null,
});

const mapAdminRagSettings = (settings: AdminRagSettingsDto): AdminRagSettings => ({
  enabled: settings.enabled ?? false,
  semanticSearchEnabled: settings.semanticSearchEnabled ?? false,
  videoQuestionsEnabled: settings.videoQuestionsEnabled ?? false,
  crossVideoQuestionsEnabled: settings.crossVideoQuestionsEnabled ?? false,
  embeddingProvider: settings.embeddingProvider ?? null,
  embeddingModel: settings.embeddingModel ?? null,
  embeddingBatchSize: settings.embeddingBatchSize ?? 0,
  retrievalDefaultMode: settings.retrievalDefaultMode ?? null,
  semanticTopK: settings.semanticTopK ?? 0,
  fullTextTopK: settings.fullTextTopK ?? 0,
  hybridSemanticWeight: settings.hybridSemanticWeight ?? 0.5,
  hybridLexicalWeight: settings.hybridLexicalWeight ?? 0.5,
  hybridMaxCandidates: settings.hybridMaxCandidates ?? 0,
  qaProvider: settings.qaProvider ?? null,
  geminiQaModel: settings.geminiQaModel ?? null,
  grokQaModel: settings.grokQaModel ?? null,
  groqQaModel: settings.groqQaModel ?? null,
  qaMaxContextChunks: settings.qaMaxContextChunks ?? 0,
  qaMaxCitations: settings.qaMaxCitations ?? 0,
  qaTemperature: settings.qaTemperature ?? 0.0,
  qaMaxOutputTokens: settings.qaMaxOutputTokens ?? 0,
  qaModelCatalog: settings.qaModelCatalog
    ? settings.qaModelCatalog.map(mapQaProviderModelCatalog)
    : null,
  geminiApiKey: mapSystemSecretStatus(settings.geminiApiKey),
  grokApiKey: mapSystemSecretStatus(settings.grokApiKey),
  groqApiKey: mapSystemSecretStatus(settings.groqApiKey),
});

const mapGroundedQuestionCitation = (citation: GroundedQuestionCitationDto): GroundedQuestionCitation => ({
  videoId: citation.videoId ?? '',
  videoTitle: citation.videoTitle ?? null,
  transcriptionId: citation.transcriptionId ?? '',
  chunkId: citation.chunkId ?? '',
  startSeconds: citation.startSeconds ?? 0,
  endSeconds: citation.endSeconds ?? 0,
  content: citation.content ?? null,
});

const mapGroundedQuestionAnswer = (qa: GroundedQuestionAnswerDto): GroundedQuestionAnswer => ({
  question: qa.question ?? null,
  retrievalMode: qa.retrievalMode ?? null,
  answer: qa.answer ?? null,
  usedChunkCount: qa.usedChunkCount ?? 0,
  citations: qa.citations ? qa.citations.map(mapGroundedQuestionCitation) : null,
});

const mapAdminTranscriptionSettings = (
  settings: AdminTranscriptionSettingsDto
): AdminTranscriptionSettings => ({
  enabled: settings.enabled ?? false,
  autoTranscribeOnReady: settings.autoTranscribeOnReady ?? false,
  provider: settings.provider ?? null,
  defaultLanguage: settings.defaultLanguage ?? null,
  outputFormats: settings.outputFormats ?? [],
  model: settings.model ?? null,
  device: settings.device ?? null,
  computeType: settings.computeType ?? null,
  beamSize: settings.beamSize ?? 1,
  enableVad: settings.enableVad ?? false,
  enableWordTimestamps: settings.enableWordTimestamps ?? false,
});

const mapAdminVideoProcessingJob = (
  job: AdminVideoProcessingJobDto
): AdminVideoProcessingJob => ({
  jobKey: job.jobKey ?? null,
  videoId: job.videoId ?? '',
  videoTitle: job.videoTitle ?? null,
  jobType: job.jobType ?? null,
  status: job.status ?? null,
  progress: job.progress ?? 0,
  errorMessage: job.errorMessage ?? null,
  createdAt: job.createdAt ? new Date(job.createdAt) : new Date(),
  startedAt: job.startedAt ? new Date(job.startedAt) : null,
  completedAt: job.completedAt ? new Date(job.completedAt) : null,
  videoStatus: job.videoStatus ?? null,
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

const mapPlaylist = (playlist: PlaylistDto): Playlist => ({
  id: playlist.id ?? '',
  name: playlist.name ?? 'Untitled playlist',
  description: playlist.description ?? '',
  ownerId: playlist.ownerId ?? '',
  ownerName: playlist.ownerName ?? 'Unknown owner',
  visibility: playlist.visibility ?? 'Private',
  videoCount: playlist.videoCount ?? 0,
  createdAt: playlist.createdAt ? new Date(playlist.createdAt) : new Date(),
  updatedAt: playlist.updatedAt ? new Date(playlist.updatedAt) : new Date(),
});

const mapPlaylistVideosPage = (page: PlaylistVideosPageDto): PlaylistVideosPage => ({
  playlist: mapPlaylist(page.playlist ?? {}),
  videos: mapPagedResponse(page.videos ?? emptyPagedResponse<VideoSummaryDto>(), mapVideoSummary),
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

const mapAnalyticsSummary = (summary: AnalyticsSummaryDto): AnalyticsSummary => ({
  totalViews: summary.totalViews ?? 0,
  uniqueViewers: summary.uniqueViewers ?? 0,
  totalWatchTime: summary.totalWatchTime ?? 0,
  averageWatchTime: summary.averageWatchTime ?? 0,
  averageCompletionRate: summary.averageCompletionRate ?? 0,
  completionCount: summary.completionCount ?? 0,
});

const mapAnalyticsTimeSeriesPoint = (point: AnalyticsTimeSeriesPointDto): AnalyticsTimeSeriesPoint => ({
  periodStart: point.periodStart ? new Date(point.periodStart) : new Date(),
  viewCount: point.viewCount ?? 0,
});

const mapRankedVideoAnalytics = (video: RankedVideoAnalyticsDto): RankedVideoAnalytics => ({
  videoId: video.videoId ?? '',
  title: video.title ?? 'Untitled video',
  viewCount: video.viewCount ?? 0,
  totalWatchTime: video.totalWatchTime ?? 0,
  likeCount: video.likeCount ?? 0,
  dislikeCount: video.dislikeCount ?? 0,
  commentCount: video.commentCount ?? 0,
  engagementScore: video.engagementScore ?? 0,
});

const mapActiveViewers = (activeViewers: ActiveViewersDto): ActiveViewers => ({
  activeViewerCount: activeViewers.activeViewerCount ?? 0,
  windowMinutes: activeViewers.windowMinutes ?? 0,
});

const mapPeakWatchTimeItem = (item: PeakWatchTimeItemDto): PeakWatchTimeItem => ({
  hourLabel: item.hourLabel ?? 'Unknown',
  watchActivityCount: item.watchActivityCount ?? 0,
});

const mapDeviceBreakdownItem = (item: DeviceBreakdownItemDto): AnalyticsBreakdownItem => ({
  label: item.deviceType ?? 'Unknown',
  value: item.viewerCount ?? 0,
});

const mapBrowserBreakdownItem = (item: BrowserBreakdownItemDto): AnalyticsBreakdownItem => ({
  label: item.browserFamily ?? 'Unknown',
  value: item.viewerCount ?? 0,
});

const mapCategoryBreakdownItem = (item: CategoryBreakdownItemDto): AnalyticsBreakdownItem => ({
  label: item.categoryName ?? 'Uncategorized',
  value: item.viewCount ?? 0,
});

const mapTagBreakdownItem = (item: TagBreakdownItemDto): AnalyticsBreakdownItem => ({
  label: item.tagName ?? 'Untagged',
  value: item.viewCount ?? 0,
});

const mapAuthBreakdown = (breakdown: AuthBreakdownDto): AuthBreakdown => ({
  authenticatedViewCount: breakdown.authenticatedViewCount ?? 0,
  anonymousViewCount: breakdown.anonymousViewCount ?? 0,
});

const mapAnalyticsEngagementSummary = (
  dto: AnalyticsEngagementSummaryDto
): AnalyticsEngagementSummary => ({
  likeCount: dto.likeCount ?? 0,
  dislikeCount: dto.dislikeCount ?? 0,
  commentCount: dto.commentCount ?? 0,
  engagementScore: dto.engagementScore ?? 0,
  engagementRate: dto.engagementRate ?? null,
});

const mapRecordAnalyticsEventResult = (
  result: RecordAnalyticsEventResultDto | undefined
): RecordAnalyticsEventResult => ({
  eventRecorded: result?.eventRecorded ?? false,
  viewCountIncremented: result?.viewCountIncremented ?? false,
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
  private refreshToken: string | null = null;
  private accessTokenExpiresAt: string | null = null;
  private refreshTokenExpiresAt: string | null = null;
  private refreshPromise: Promise<ApiResponse<AuthSession>> | null = null;
  private baseUrl = normalizeApiBaseUrl(API_BASE_URL);
  private analyticsBaseUrl = normalizeApiBaseUrl(ANALYTICS_API_BASE_URL);

  constructor() {
    // Load token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
      this.refreshToken = localStorage.getItem('refreshToken');
      this.accessTokenExpiresAt = localStorage.getItem('accessTokenExpiresAt');
      this.refreshTokenExpiresAt = localStorage.getItem('refreshTokenExpiresAt');
    }
  }

  setAuthToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      this.refreshToken = localStorage.getItem('refreshToken');
      this.accessTokenExpiresAt = localStorage.getItem('accessTokenExpiresAt');
      this.refreshTokenExpiresAt = localStorage.getItem('refreshTokenExpiresAt');
    }
  }

  setAuthSession(session: {
    token: string;
    refreshToken: string;
    accessTokenExpiresAt: string;
    refreshTokenExpiresAt: string;
  }) {
    this.token = session.token;
    this.refreshToken = session.refreshToken;
    this.accessTokenExpiresAt = session.accessTokenExpiresAt;
    this.refreshTokenExpiresAt = session.refreshTokenExpiresAt;
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', session.token);
      localStorage.setItem('refreshToken', session.refreshToken);
      localStorage.setItem('accessTokenExpiresAt', session.accessTokenExpiresAt);
      localStorage.setItem('refreshTokenExpiresAt', session.refreshTokenExpiresAt);
    }
  }

  clearAuth() {
    this.token = null;
    this.refreshToken = null;
    this.accessTokenExpiresAt = null;
    this.refreshTokenExpiresAt = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('accessTokenExpiresAt');
      localStorage.removeItem('refreshTokenExpiresAt');
      localStorage.removeItem('user');
    }
  }

  hasAuthToken() {
    return Boolean(this.token);
  }

  private appendDateRange(params: URLSearchParams, filters: AnalyticsDateRange = {}) {
    appendQueryParam(params, 'from', filters.from?.toISOString());
    appendQueryParam(params, 'to', filters.to?.toISOString());
  }

  private async getValidToken(): Promise<string | null> {
    if (!this.token) {
      return null;
    }

    const isTokenExpired = () => {
      if (!this.accessTokenExpiresAt) return true;
      const expiryTime = new Date(this.accessTokenExpiresAt).getTime();
      return Number.isNaN(expiryTime) || expiryTime <= Date.now() + 10000;
    };

    if (isTokenExpired() && this.refreshToken) {
      if (this.refreshTokenExpiresAt) {
        const refreshExpiryTime = new Date(this.refreshTokenExpiresAt).getTime();
        if (Number.isNaN(refreshExpiryTime) || refreshExpiryTime <= Date.now()) {
          this.clearAuth();
          return null;
        }
      }

      if (!this.refreshPromise) {
        this.refreshPromise = this.refreshAuth(this.refreshToken).then((res) => {
          this.refreshPromise = null;
          if (res.success && res.data) {
            this.setAuthSession(res.data);
          } else {
            this.clearAuth();
          }
          return res;
        });
      }

      const res = await this.refreshPromise;
      if (res.success && res.data) {
        return res.data.token;
      }
      return null;
    }

    return this.token;
  }

  private async requestRawFromBase<T>(baseUrl: string, path: string, options: RequestInit = {}): Promise<T> {
    const isFormData = options.body instanceof FormData;
    const headers = new Headers(options.headers);

    if (!isFormData && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const isRefreshPath = path.endsWith('/auth/refresh');
    let activeToken = this.token;

    if (!isRefreshPath) {
      activeToken = await this.getValidToken();
    }

    if (activeToken) {
      headers.set('Authorization', `Bearer ${activeToken}`);
    }

    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw new Error(data?.error || data?.message || 'Request failed');
    }

    return data;
  }

  private async requestRaw<T>(path: string, options: RequestInit = {}): Promise<T> {
    const isFormData = options.body instanceof FormData;
    const headers = new Headers(options.headers);

    if (!isFormData && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const isRefreshPath = path.endsWith('/auth/refresh');
    let activeToken = this.token;

    if (!isRefreshPath) {
      activeToken = await this.getValidToken();
    }

    if (activeToken) {
      headers.set('Authorization', `Bearer ${activeToken}`);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && !isRefreshPath) {
      this.clearAuth();
    }

    const data = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw new Error(data?.error || data?.message || 'Request failed');
    }

    return data;
  }

  private async requestResponse(path: string, options: RequestInit = {}): Promise<Response> {
    const isFormData = options.body instanceof FormData;
    const headers = new Headers(options.headers);

    if (!isFormData && !headers.has('Content-Type') && options.body !== undefined) {
      headers.set('Content-Type', 'application/json');
    }

    const activeToken = await this.getValidToken();
    if (activeToken) {
      headers.set('Authorization', `Bearer ${activeToken}`);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = 'Request failed';

      try {
        const data = await response.clone().json();
        errorMessage = data?.error || data?.message || errorMessage;
      } catch {
        try {
          const text = await response.clone().text();
          if (text) {
            errorMessage = text;
          }
        } catch {}
      }

      throw new Error(errorMessage);
    }

    return response;
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
      this.setAuthSession(session);

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
      appendQueryParam(params, 'excludeUploaderId', filters.excludeUploaderId);
      appendQueryParam(params, 'status', filters.status);
      appendQueryParam(params, 'visibility', filters.visibility);
      appendQueryParam(params, 'sort', filters.sort);
      appendQueryParam(params, 'page', filters.page ?? 1);
      appendQueryParam(params, 'pageSize', filters.pageSize ?? 24);
      appendQueryParam(params, 'createdFrom', filters.createdFrom);
      appendQueryParam(params, 'createdTo', filters.createdTo);

      const response = await this.requestRaw<PaginatedResponse<VideoSummaryDto>>(
        `${API_V1_PREFIX}/videos?${params.toString()}`
      );

      return {
        success: true,
        data: mapPagedResponse(response, mapVideoSummary),
      };
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
      return {
        success: false,
        error: 'Failed to fetch video processing status',
      };
    }
  }

  async getVideoTranscriptions(
    videoId: string,
    options: { shareToken?: string } = {}
  ): Promise<ApiResponse<VideoTranscription[]>> {
    try {
      const params = new URLSearchParams();
      appendQueryParam(params, 'shareToken', options.shareToken);
      const query = params.toString();
      const response = await this.requestRaw<VideoTranscriptionDto[]>(
        `${API_V1_PREFIX}/videos/${videoId}/transcriptions${query ? `?${query}` : ''}`
      );

      return {
        success: true,
        data: response.map(mapVideoTranscription),
      };
    } catch {
      return {
        success: false,
        error: 'Failed to fetch video transcriptions',
      };
    }
  }

  async requestVideoTranscription(
    videoId: string,
    payload: RequestVideoTranscriptionRequest
  ): Promise<ApiResponse<VideoTranscription[]>> {
    try {
      const response = await this.requestRaw<VideoTranscriptionDto[]>(
        `${API_V1_PREFIX}/videos/${videoId}/transcriptions`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      return {
        success: true,
        data: response.map(mapVideoTranscription),
      };
    } catch {
      return {
        success: false,
        error: 'Failed to request transcription',
      };
    }
  }

  async getVideoTranscriptionJobs(
    videoId: string,
    options: { shareToken?: string } = {}
  ): Promise<ApiResponse<VideoTranscriptionJob[]>> {
    try {
      const params = new URLSearchParams();
      appendQueryParam(params, 'shareToken', options.shareToken);
      const query = params.toString();
      const response = await this.requestRaw<VideoTranscriptionJobDto[]>(
        `${API_V1_PREFIX}/videos/${videoId}/transcription-jobs${query ? `?${query}` : ''}`
      );

      return {
        success: true,
        data: response.map(mapVideoTranscriptionJob),
      };
    } catch {
      return {
        success: false,
        error: 'Failed to fetch transcription jobs',
      };
    }
  }

  async getVideoTranscriptionStatus(
    videoId: string,
    transcriptionId: string,
    options: { shareToken?: string } = {}
  ): Promise<ApiResponse<VideoTranscription>> {
    try {
      const params = new URLSearchParams();
      appendQueryParam(params, 'shareToken', options.shareToken);
      const query = params.toString();
      const response = await this.requestRaw<VideoTranscriptionDto>(
        `${API_V1_PREFIX}/videos/${videoId}/transcriptions/${transcriptionId}/status${query ? `?${query}` : ''}`
      );

      return {
        success: true,
        data: mapVideoTranscription(response),
      };
    } catch {
      return {
        success: false,
        error: 'Failed to fetch transcription status',
      };
    }
  }

  async getVideoTranscriptionChunks(
    videoId: string,
    transcriptionId: string,
    options: { shareToken?: string } = {}
  ): Promise<ApiResponse<TranscriptChunk[]>> {
    try {
      const params = new URLSearchParams();
      appendQueryParam(params, 'shareToken', options.shareToken);
      const query = params.toString();
      const response = await this.requestRaw<TranscriptChunkDto[]>(
        `${API_V1_PREFIX}/videos/${videoId}/transcriptions/${transcriptionId}/chunks${query ? `?${query}` : ''}`
      );

      return {
        success: true,
        data: response.map(mapTranscriptChunk),
      };
    } catch {
      return {
        success: false,
        error: 'Failed to fetch transcription chunks',
      };
    }
  }

  async searchVideoTranscript(
    videoId: string,
    filters: TranscriptSearchFilters = {}
  ): Promise<ApiResponse<PaginatedResponse<TranscriptSearchResult>>> {
    try {
      const params = new URLSearchParams();
      appendQueryParam(params, 'q', filters.q);
      appendQueryParam(params, 'language', filters.language);
      appendQueryParam(params, 'page', filters.page ?? 1);
      appendQueryParam(params, 'pageSize', filters.pageSize ?? 20);
      appendQueryParam(params, 'shareToken', filters.shareToken);

      const response = await this.requestRaw<PaginatedResponse<TranscriptSearchResultDto>>(
        `${API_V1_PREFIX}/videos/${videoId}/transcript-search?${params.toString()}`
      );

      return {
        success: true,
        data: mapPagedResponse(response, mapTranscriptSearchResult),
      };
    } catch {
      return {
        success: false,
        error: 'Failed to search transcript',
      };
    }
  }

  async askVideoQuestion(
    videoId: string,
    payload: AskVideoQuestionRequest,
    options: { shareToken?: string } = {}
  ): Promise<ApiResponse<GroundedQuestionAnswer>> {
    try {
      const params = new URLSearchParams();
      appendQueryParam(params, 'shareToken', options.shareToken);
      const queryStr = params.toString();

      const response = await this.requestRaw<GroundedQuestionAnswerDto>(
        `${API_V1_PREFIX}/videos/${videoId}/questions${queryStr ? `?${queryStr}` : ''}`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      return {
        success: true,
        data: mapGroundedQuestionAnswer(response),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to get answer for video',
      };
    }
  }

  async askCrossVideoQuestion(
    payload: AskQuestionAcrossVideosRequest
  ): Promise<ApiResponse<GroundedQuestionAnswer>> {
    try {
      const response = await this.requestRaw<GroundedQuestionAnswerDto>(
        `${API_V1_PREFIX}/questions`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      return {
        success: true,
        data: mapGroundedQuestionAnswer(response),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to get answer across videos',
      };
    }
  }

  async getVideoTranscriptionArtifactText(
    videoId: string,
    transcriptionId: string,
    options: { shareToken?: string } = {}
  ): Promise<ApiResponse<TranscriptionArtifactText>> {
    try {
      const params = new URLSearchParams();
      appendQueryParam(params, 'shareToken', options.shareToken);
      const query = params.toString();
      const response = await this.requestResponse(
        `${API_V1_PREFIX}/videos/${videoId}/transcriptions/${transcriptionId}/content${query ? `?${query}` : ''}`
      );

      return {
        success: true,
        data: {
          content: await response.text(),
          contentType: response.headers.get('content-type'),
        },
      };
    } catch {
      return {
        success: false,
        error: 'Failed to fetch transcription artifact',
      };
    }
  }

  async downloadVideoTranscriptionArtifact(
    videoId: string,
    transcriptionId: string,
    options: { shareToken?: string } = {}
  ): Promise<ApiResponse<TranscriptionArtifactFile>> {
    try {
      const params = new URLSearchParams();
      appendQueryParam(params, 'shareToken', options.shareToken);
      const query = params.toString();
      const response = await this.requestResponse(
        `${API_V1_PREFIX}/videos/${videoId}/transcriptions/${transcriptionId}/content${query ? `?${query}` : ''}`
      );

      return {
        success: true,
        data: {
          blob: await response.blob(),
          contentType: response.headers.get('content-type'),
        },
      };
    } catch {
      return {
        success: false,
        error: 'Failed to download transcription artifact',
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
    } catch {
      return {
        success: false,
        error: 'Failed to fetch categories',
      };
    }
  }

  async createCategory(data: CreateCategoryRequest): Promise<ApiResponse<Category>> {
    try {
      const response = await this.requestRaw<CategoryDto>(`${API_V1_PREFIX}/categories`, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      return {
        success: true,
        data: mapCategory(response),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create category',
      };
    }
  }

  async updateCategory(categoryId: string, data: UpdateCategoryRequest): Promise<ApiResponse<Category>> {
    try {
      const response = await this.requestRaw<CategoryDto>(`${API_V1_PREFIX}/categories/${categoryId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });

      return {
        success: true,
        data: mapCategory(response),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update category',
      };
    }
  }

  async deleteCategory(categoryId: string): Promise<ApiResponse<void>> {
    try {
      await this.requestRaw<void>(`${API_V1_PREFIX}/categories/${categoryId}`, {
        method: 'DELETE',
      });

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete category',
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
    } catch {
      return {
        success: false,
        error: 'Failed to fetch tags',
      };
    }
  }

  async createTag(data: CreateTagRequest): Promise<ApiResponse<TagSummary>> {
    try {
      const response = await this.requestRaw<TagSummaryDto>(`${API_V1_PREFIX}/tags`, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      return {
        success: true,
        data: mapTagSummary(response),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create tag',
      };
    }
  }

  async updateTag(tagId: string, data: UpdateTagRequest): Promise<ApiResponse<TagSummary>> {
    try {
      const response = await this.requestRaw<TagSummaryDto>(`${API_V1_PREFIX}/tags/${tagId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });

      return {
        success: true,
        data: mapTagSummary(response),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update tag',
      };
    }
  }

  async deleteTag(tagId: string): Promise<ApiResponse<void>> {
    try {
      await this.requestRaw<void>(`${API_V1_PREFIX}/tags/${tagId}`, {
        method: 'DELETE',
      });

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete tag',
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
      appendQueryParam(params, 'createdFrom', filters.createdFrom);
      appendQueryParam(params, 'createdTo', filters.createdTo);

      const response = await this.requestRaw<PaginatedResponse<UserProfileDto>>(
        `${API_V1_PREFIX}/users?${params.toString()}`
      );

      return {
        success: true,
        data: mapPagedResponse(response, mapUserProfile),
      };
    } catch {
      return {
        success: false,
        error: 'Failed to fetch users',
      };
    }
  }

  async getAdminTranscriptionSettings(): Promise<ApiResponse<AdminTranscriptionSettings>> {
    try {
      const response = await this.requestRaw<AdminTranscriptionSettingsDto>(
        `${API_V1_PREFIX}/admin/settings/transcription`
      );

      return {
        success: true,
        data: mapAdminTranscriptionSettings(response),
      };
    } catch {
      return {
        success: false,
        error: 'Failed to fetch transcription settings',
      };
    }
  }

  async updateAdminTranscriptionSettings(
    payload: UpdateAdminTranscriptionSettingsRequest
  ): Promise<ApiResponse<AdminTranscriptionSettings>> {
    try {
      const response = await this.requestRaw<AdminTranscriptionSettingsDto>(
        `${API_V1_PREFIX}/admin/settings/transcription`,
        {
          method: 'PUT',
          body: JSON.stringify(payload),
        }
      );

      return {
        success: true,
        data: mapAdminTranscriptionSettings(response),
      };
    } catch {
      return {
        success: false,
        error: 'Failed to update transcription settings',
      };
    }
  }

  async getAdminRagSettings(): Promise<ApiResponse<AdminRagSettings>> {
    try {
      const response = await this.requestRaw<AdminRagSettingsDto>(
        `${API_V1_PREFIX}/admin/settings/rag`
      );

      return {
        success: true,
        data: mapAdminRagSettings(response),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to fetch RAG settings',
      };
    }
  }

  async updateAdminRagSettings(
    payload: UpdateAdminRagSettingsRequest
  ): Promise<ApiResponse<AdminRagSettings>> {
    try {
      const response = await this.requestRaw<AdminRagSettingsDto>(
        `${API_V1_PREFIX}/admin/settings/rag`,
        {
          method: 'PUT',
          body: JSON.stringify(payload),
        }
      );

      return {
        success: true,
        data: mapAdminRagSettings(response),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update RAG settings',
      };
    }
  }

  async getAdminTranscriptionJobs(
    filters: {
      Page?: number;
      PageSize?: number;
      Status?: string | 'all';
      VideoId?: string;
      UploaderUserId?: string;
      Search?: string;
      CreatedFrom?: string;
      CreatedTo?: string;
      HasError?: boolean;
      Provider?: string;
      Language?: string;
      Format?: string;
      Source?: string;
      SortBy?: string;
      SortDirection?: string;
    } = {}
  ): Promise<ApiResponse<PaginatedResponse<VideoTranscriptionJob>>> {
    try {
      const params = new URLSearchParams();
      appendQueryParam(params, 'Page', filters.Page);
      appendQueryParam(params, 'PageSize', filters.PageSize);
      appendQueryParam(params, 'Status', filters.Status && filters.Status !== 'all' ? filters.Status : undefined);
      appendQueryParam(params, 'VideoId', filters.VideoId);
      appendQueryParam(params, 'UploaderUserId', filters.UploaderUserId);
      appendQueryParam(params, 'Search', filters.Search);
      appendQueryParam(params, 'CreatedFrom', filters.CreatedFrom);
      appendQueryParam(params, 'CreatedTo', filters.CreatedTo);
      appendQueryParam(params, 'HasError', filters.HasError);
      appendQueryParam(params, 'Provider', filters.Provider);
      appendQueryParam(params, 'Language', filters.Language);
      appendQueryParam(params, 'Format', filters.Format);
      appendQueryParam(params, 'Source', filters.Source);
      appendQueryParam(params, 'SortBy', filters.SortBy);
      appendQueryParam(params, 'SortDirection', filters.SortDirection);

      const query = params.toString();
      const response = await this.requestRaw<PaginatedResponse<VideoTranscriptionJobDto>>(
        `${API_V1_PREFIX}/admin/processing/transcription-jobs${query ? `?${query}` : ''}`
      );

      return {
        success: true,
        data: mapPagedResponse(response, mapVideoTranscriptionJob),
      };
    } catch {
      return {
        success: false,
        error: 'Failed to fetch transcription jobs',
      };
    }
  }

  async getAdminTranscriptionJob(jobKey: string): Promise<ApiResponse<VideoTranscriptionJob>> {
    try {
      const response = await this.requestRaw<VideoTranscriptionJobDto>(
        `${API_V1_PREFIX}/admin/processing/transcription-jobs/${jobKey}`
      );

      return {
        success: true,
        data: mapVideoTranscriptionJob(response),
      };
    } catch {
      return {
        success: false,
        error: 'Failed to fetch transcription job',
      };
    }
  }

  async retryAdminTranscriptionJob(jobKey: string): Promise<ApiResponse<VideoTranscriptionJob>> {
    try {
      const response = await this.requestRaw<VideoTranscriptionJobDto>(
        `${API_V1_PREFIX}/admin/processing/transcription-jobs/${jobKey}/retry`,
        { method: 'POST' }
      );

      return {
        success: true,
        data: mapVideoTranscriptionJob(response),
      };
    } catch {
      return {
        success: false,
        error: 'Failed to retry transcription job',
      };
    }
  }

  async resyncAdminTranscriptionJob(jobKey: string): Promise<ApiResponse<VideoTranscriptionJob>> {
    try {
      const response = await this.requestRaw<VideoTranscriptionJobDto>(
        `${API_V1_PREFIX}/admin/processing/transcription-jobs/${jobKey}/resync`,
        { method: 'POST' }
      );

      return {
        success: true,
        data: mapVideoTranscriptionJob(response),
      };
    } catch {
      return {
        success: false,
        error: 'Failed to resync transcription job',
      };
    }
  }

  async getAdminVideoProcessingJobs(
    filters: {
      Page?: number;
      PageSize?: number;
      Status?: string | 'all';
      VideoId?: string;
      UploaderUserId?: string;
      Search?: string;
      CreatedFrom?: string;
      CreatedTo?: string;
      StartedFrom?: string;
      StartedTo?: string;
      CompletedFrom?: string;
      CompletedTo?: string;
      HasError?: boolean;
      SortBy?: string;
      SortDirection?: string;
    } = {}
  ): Promise<ApiResponse<PaginatedResponse<AdminVideoProcessingJob>>> {
    try {
      const params = new URLSearchParams();
      appendQueryParam(params, 'Page', filters.Page);
      appendQueryParam(params, 'PageSize', filters.PageSize);
      appendQueryParam(params, 'Status', filters.Status && filters.Status !== 'all' ? filters.Status : undefined);
      appendQueryParam(params, 'VideoId', filters.VideoId);
      appendQueryParam(params, 'UploaderUserId', filters.UploaderUserId);
      appendQueryParam(params, 'Search', filters.Search);
      appendQueryParam(params, 'CreatedFrom', filters.CreatedFrom);
      appendQueryParam(params, 'CreatedTo', filters.CreatedTo);
      appendQueryParam(params, 'StartedFrom', filters.StartedFrom);
      appendQueryParam(params, 'StartedTo', filters.StartedTo);
      appendQueryParam(params, 'CompletedFrom', filters.CompletedFrom);
      appendQueryParam(params, 'CompletedTo', filters.CompletedTo);
      appendQueryParam(params, 'HasError', filters.HasError);
      appendQueryParam(params, 'SortBy', filters.SortBy);
      appendQueryParam(params, 'SortDirection', filters.SortDirection);

      const query = params.toString();
      const response = await this.requestRaw<PaginatedResponse<AdminVideoProcessingJobDto>>(
        `${API_V1_PREFIX}/admin/processing/video-jobs${query ? `?${query}` : ''}`
      );

      return {
        success: true,
        data: mapPagedResponse(response, mapAdminVideoProcessingJob),
      };
    } catch {
      return {
        success: false,
        error: 'Failed to fetch video processing jobs',
      };
    }
  }

  async getAdminVideoProcessingJob(jobKey: string): Promise<ApiResponse<AdminVideoProcessingJob>> {
    try {
      const response = await this.requestRaw<AdminVideoProcessingJobDto>(
        `${API_V1_PREFIX}/admin/processing/video-jobs/${jobKey}`
      );

      return {
        success: true,
        data: mapAdminVideoProcessingJob(response),
      };
    } catch {
      return {
        success: false,
        error: 'Failed to fetch video processing job',
      };
    }
  }

  async retryAdminVideoProcessingJob(jobKey: string): Promise<ApiResponse<AdminVideoProcessingJob>> {
    try {
      const response = await this.requestRaw<AdminVideoProcessingJobDto>(
        `${API_V1_PREFIX}/admin/processing/video-jobs/${jobKey}/retry`,
        { method: 'POST' }
      );

      return {
        success: true,
        data: mapAdminVideoProcessingJob(response),
      };
    } catch {
      return {
        success: false,
        error: 'Failed to retry video processing job',
      };
    }
  }

  async resyncAdminVideoProcessingJob(jobKey: string): Promise<ApiResponse<AdminVideoProcessingJob>> {
    try {
      const response = await this.requestRaw<AdminVideoProcessingJobDto>(
        `${API_V1_PREFIX}/admin/processing/video-jobs/${jobKey}/resync`,
        { method: 'POST' }
      );

      return {
        success: true,
        data: mapAdminVideoProcessingJob(response),
      };
    } catch {
      return {
        success: false,
        error: 'Failed to resync video processing job',
      };
    }
  }

  async createUser(userData: Partial<User> & { password: string }): Promise<ApiResponse<User>> {
    try {
      return await this.request<User>('/admin/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
      return {
        success: false,
        error: 'Failed to fetch bookmarks',
      };
    }
  }

  // Analytics Endpoints
  async recordAnalyticsEvent(
    videoId: string,
    request: RecordAnalyticsEventRequest
  ): Promise<ApiResponse<RecordAnalyticsEventResult>> {
    if (!ANALYTICS_INGESTION_ENABLED || (!ANALYTICS_SEND_ANONYMOUS && !this.hasAuthToken())) {
      return {
        success: true,
        data: { eventRecorded: false, viewCountIncremented: false },
      };
    }

    try {
      const result = await this.requestRawFromBase<RecordAnalyticsEventResultDto>(
        this.analyticsBaseUrl,
        `${API_V1_PREFIX}/videos/${videoId}/analytics/events`,
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );

      return {
        success: true,
        data: mapRecordAnalyticsEventResult(result),
      };
    } catch {
      return {
        success: false,
        error: 'Failed to record analytics event',
      };
    }
  }

  async getAdminAnalyticsSummary(filters: AnalyticsDateRange = {}): Promise<ApiResponse<AnalyticsSummary>> {
    try {
      const params = new URLSearchParams();
      this.appendDateRange(params, filters);
      const summary = await this.requestRaw<AnalyticsSummaryDto>(
        `${API_V1_PREFIX}/admin/analytics/summary?${params.toString()}`
      );

      return {
        success: true,
        data: mapAnalyticsSummary(summary),
      };
    } catch {
      return { success: false, error: 'Failed to fetch analytics summary' };
    }
  }

  async getAdminViewsOverTime(filters: AnalyticsDateRange = {}): Promise<ApiResponse<AnalyticsTimeSeriesPoint[]>> {
    try {
      const params = new URLSearchParams();
      this.appendDateRange(params, filters);
      const points = await this.requestRaw<AnalyticsTimeSeriesPointDto[]>(
        `${API_V1_PREFIX}/admin/analytics/views-over-time?${params.toString()}`
      );

      return {
        success: true,
        data: points.map(mapAnalyticsTimeSeriesPoint),
      };
    } catch {
      return { success: false, error: 'Failed to fetch views over time' };
    }
  }

  async getAdminRankedVideos(
    kind: Exclude<RankedAnalyticsKind, 'top'>,
    filters: AnalyticsDateRange & { page?: number; pageSize?: number } = {}
  ): Promise<ApiResponse<PaginatedResponse<RankedVideoAnalytics>>> {
    try {
      const params = new URLSearchParams();
      this.appendDateRange(params, filters);
      appendQueryParam(params, 'page', filters.page ?? 1);
      appendQueryParam(params, 'pageSize', filters.pageSize ?? 10);
      const response = await this.requestRaw<PaginatedResponse<RankedVideoAnalyticsDto>>(
        `${API_V1_PREFIX}/admin/analytics/${kind}-videos?${params.toString()}`
      );

      return {
        success: true,
        data: mapPagedResponse(response, mapRankedVideoAnalytics),
      };
    } catch {
      return { success: false, error: 'Failed to fetch ranked videos' };
    }
  }

  async getAdminActiveViewers(): Promise<ApiResponse<ActiveViewers>> {
    try {
      const response = await this.requestRaw<ActiveViewersDto>(`${API_V1_PREFIX}/admin/analytics/active-viewers`);

      return {
        success: true,
        data: mapActiveViewers(response),
      };
    } catch {
      return { success: false, error: 'Failed to fetch active viewers' };
    }
  }

  async getAdminPeakWatchTime(filters: AnalyticsDateRange = {}): Promise<ApiResponse<PeakWatchTimeItem[]>> {
    try {
      const params = new URLSearchParams();
      this.appendDateRange(params, filters);
      const response = await this.requestRaw<PeakWatchTimeItemDto[]>(
        `${API_V1_PREFIX}/admin/analytics/peak-watch-time?${params.toString()}`
      );

      return {
        success: true,
        data: response.map(mapPeakWatchTimeItem),
      };
    } catch {
      return { success: false, error: 'Failed to fetch peak watch time' };
    }
  }

  async getAdminBreakdown(
    kind: AnalyticsBreakdownKind,
    filters: AnalyticsDateRange = {}
  ): Promise<ApiResponse<AnalyticsBreakdownItem[]>> {
    try {
      const params = new URLSearchParams();
      this.appendDateRange(params, filters);
      const path = `${API_V1_PREFIX}/admin/analytics/${kind}-breakdown?${params.toString()}`;

      if (kind === 'device') {
        const response = await this.requestRaw<DeviceBreakdownItemDto[]>(path);
        return { success: true, data: response.map(mapDeviceBreakdownItem) };
      }

      if (kind === 'browser') {
        const response = await this.requestRaw<BrowserBreakdownItemDto[]>(path);
        return { success: true, data: response.map(mapBrowserBreakdownItem) };
      }

      if (kind === 'category') {
        const response = await this.requestRaw<CategoryBreakdownItemDto[]>(path);
        return { success: true, data: response.map(mapCategoryBreakdownItem) };
      }

      const response = await this.requestRaw<TagBreakdownItemDto[]>(path);
      return { success: true, data: response.map(mapTagBreakdownItem) };
    } catch {
      return { success: false, error: 'Failed to fetch analytics breakdown' };
    }
  }

  async getAdminAuthBreakdown(filters: AnalyticsDateRange = {}): Promise<ApiResponse<AuthBreakdown>> {
    try {
      const params = new URLSearchParams();
      this.appendDateRange(params, filters);
      const response = await this.requestRaw<AuthBreakdownDto>(
        `${API_V1_PREFIX}/admin/analytics/auth-breakdown?${params.toString()}`
      );

      return {
        success: true,
        data: mapAuthBreakdown(response),
      };
    } catch {
      return { success: false, error: 'Failed to fetch auth breakdown' };
    }
  }

  async downloadAdminAnalyticsOverview(filters: AnalyticsDateRange = {}): Promise<ApiResponse<Blob>> {
    try {
      const params = new URLSearchParams();
      this.appendDateRange(params, filters);
      params.set('format', 'csv');
      const headers = new Headers();

      if (this.token) {
        headers.set('Authorization', `Bearer ${this.token}`);
      }

      const response = await fetch(`${this.baseUrl}${API_V1_PREFIX}/admin/analytics/reports/overview?${params.toString()}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      return {
        success: true,
        data: await response.blob(),
      };
    } catch {
      return { success: false, error: 'Failed to download analytics export' };
    }
  }

  async downloadMeAnalyticsVideos(filters: AnalyticsDateRange = {}): Promise<ApiResponse<Blob>> {
    try {
      const params = new URLSearchParams();
      this.appendDateRange(params, filters);
      params.set('format', 'csv');
      const headers = new Headers();

      if (this.token) {
        headers.set('Authorization', `Bearer ${this.token}`);
      }

      const response = await fetch(`${this.baseUrl}${API_V1_PREFIX}/me/analytics/reports/videos?${params.toString()}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      return {
        success: true,
        data: await response.blob(),
      };
    } catch {
      return { success: false, error: 'Failed to download analytics export' };
    }
  }

  async getMeAnalyticsSummary(filters: AnalyticsDateRange = {}): Promise<ApiResponse<AnalyticsSummary>> {
    try {
      const params = new URLSearchParams();
      this.appendDateRange(params, filters);
      const summary = await this.requestRaw<AnalyticsSummaryDto>(
        `${API_V1_PREFIX}/me/analytics/summary?${params.toString()}`
      );

      return { success: true, data: mapAnalyticsSummary(summary) };
    } catch {
      return { success: false, error: 'Failed to fetch analytics summary' };
    }
  }

  async getMeViewsOverTime(filters: AnalyticsDateRange = {}): Promise<ApiResponse<AnalyticsTimeSeriesPoint[]>> {
    try {
      const params = new URLSearchParams();
      this.appendDateRange(params, filters);
      const points = await this.requestRaw<AnalyticsTimeSeriesPointDto[]>(
        `${API_V1_PREFIX}/me/analytics/views-over-time?${params.toString()}`
      );

      return { success: true, data: points.map(mapAnalyticsTimeSeriesPoint) };
    } catch {
      return { success: false, error: 'Failed to fetch views over time' };
    }
  }

  async getMeRankedVideos(
    kind: RankedAnalyticsKind,
    filters: AnalyticsDateRange & { page?: number; pageSize?: number } = {}
  ): Promise<ApiResponse<PaginatedResponse<RankedVideoAnalytics>>> {
    try {
      const params = new URLSearchParams();
      this.appendDateRange(params, filters);
      appendQueryParam(params, 'page', filters.page ?? 1);
      appendQueryParam(params, 'pageSize', filters.pageSize ?? 10);
      const endpoint = (kind === 'top' || kind === 'most-watched') ? 'top-videos' : `${kind}-videos`;
      const response = await this.requestRaw<PaginatedResponse<RankedVideoAnalyticsDto>>(
        `${API_V1_PREFIX}/me/analytics/${endpoint}?${params.toString()}`
      );

      return { success: true, data: mapPagedResponse(response, mapRankedVideoAnalytics) };
    } catch {
      return { success: false, error: 'Failed to fetch ranked videos' };
    }
  }

  async getMeBreakdown(
    kind: AnalyticsBreakdownKind,
    filters: AnalyticsDateRange = {}
  ): Promise<ApiResponse<AnalyticsBreakdownItem[]>> {
    try {
      const params = new URLSearchParams();
      this.appendDateRange(params, filters);
      const path = `${API_V1_PREFIX}/me/analytics/${kind}-breakdown?${params.toString()}`;

      if (kind === 'device') {
        const response = await this.requestRaw<DeviceBreakdownItemDto[]>(path);
        return { success: true, data: response.map(mapDeviceBreakdownItem) };
      }

      if (kind === 'browser') {
        const response = await this.requestRaw<BrowserBreakdownItemDto[]>(path);
        return { success: true, data: response.map(mapBrowserBreakdownItem) };
      }

      if (kind === 'category') {
        const response = await this.requestRaw<CategoryBreakdownItemDto[]>(path);
        return { success: true, data: response.map(mapCategoryBreakdownItem) };
      }

      const response = await this.requestRaw<TagBreakdownItemDto[]>(path);
      return { success: true, data: response.map(mapTagBreakdownItem) };
    } catch {
      return { success: false, error: 'Failed to fetch analytics breakdown' };
    }
  }

  async getMeAuthBreakdown(filters: AnalyticsDateRange = {}): Promise<ApiResponse<AuthBreakdown>> {
    try {
      const params = new URLSearchParams();
      this.appendDateRange(params, filters);
      const response = await this.requestRaw<AuthBreakdownDto>(
        `${API_V1_PREFIX}/me/analytics/auth-breakdown?${params.toString()}`
      );

      return { success: true, data: mapAuthBreakdown(response) };
    } catch {
      return { success: false, error: 'Failed to fetch auth breakdown' };
    }
  }

  async getVideoAnalyticsSummary(
    videoId: string,
    filters: AnalyticsDateRange = {}
  ): Promise<ApiResponse<AnalyticsSummary>> {
    try {
      const params = new URLSearchParams();
      this.appendDateRange(params, filters);
      const summary = await this.requestRaw<AnalyticsSummaryDto>(
        `${API_V1_PREFIX}/videos/${videoId}/analytics/summary?${params.toString()}`
      );
      return { success: true, data: mapAnalyticsSummary(summary) };
    } catch {
      return { success: false, error: 'Failed to fetch video analytics summary' };
    }
  }

  async getVideoAnalyticsTimeseries(
    videoId: string,
    filters: AnalyticsDateRange = {}
  ): Promise<ApiResponse<AnalyticsTimeSeriesPoint[]>> {
    try {
      const params = new URLSearchParams();
      this.appendDateRange(params, filters);
      const points = await this.requestRaw<AnalyticsTimeSeriesPointDto[]>(
        `${API_V1_PREFIX}/videos/${videoId}/analytics/timeseries?${params.toString()}`
      );
      return { success: true, data: points.map(mapAnalyticsTimeSeriesPoint) };
    } catch {
      return { success: false, error: 'Failed to fetch video analytics timeseries' };
    }
  }

  async getVideoEngagementSummary(
    videoId: string,
    filters: AnalyticsDateRange = {}
  ): Promise<ApiResponse<AnalyticsEngagementSummary>> {
    try {
      const params = new URLSearchParams();
      this.appendDateRange(params, filters);
      const engagement = await this.requestRaw<AnalyticsEngagementSummaryDto>(
        `${API_V1_PREFIX}/videos/${videoId}/analytics/engagement?${params.toString()}`
      );
      return { success: true, data: mapAnalyticsEngagementSummary(engagement) };
    } catch {
      return { success: false, error: 'Failed to fetch video engagement summary' };
    }
  }

  // Playlist Endpoints
  async getMyPlaylists(filters: PlaylistListFilters = {}): Promise<ApiResponse<PaginatedResponse<Playlist>>> {
    try {
      const params = new URLSearchParams();
      appendQueryParam(params, 'page', filters.page ?? 1);
      appendQueryParam(params, 'pageSize', filters.pageSize ?? 24);

      const response = await this.requestRaw<PaginatedResponse<PlaylistDto>>(
        `${API_V1_PREFIX}/me/playlists?${params.toString()}`
      );

      return {
        success: true,
        data: mapPagedResponse(response, mapPlaylist),
      };
    } catch {
      return {
        success: false,
        error: 'Failed to fetch playlists',
      };
    }
  }

  async getPlaylists(filters: PlaylistListFilters = {}): Promise<ApiResponse<PaginatedResponse<Playlist>>> {
    try {
      const params = new URLSearchParams();
      appendQueryParam(params, 'ownerId', filters.ownerId);
      appendQueryParam(params, 'page', filters.page ?? 1);
      appendQueryParam(params, 'pageSize', filters.pageSize ?? 24);

      const response = await this.requestRaw<PaginatedResponse<PlaylistDto>>(
        `${API_V1_PREFIX}/playlists?${params.toString()}`
      );

      return {
        success: true,
        data: mapPagedResponse(response, mapPlaylist),
      };
    } catch {
      return {
        success: false,
        error: 'Failed to fetch playlists',
      };
    }
  }

  async getPlaylistById(playlistId: string): Promise<ApiResponse<Playlist>> {
    try {
      const response = await this.requestRaw<PlaylistDto>(`${API_V1_PREFIX}/playlists/${playlistId}`);

      return {
        success: true,
        data: mapPlaylist(response),
      };
    } catch {
      return {
        success: false,
        error: 'Failed to fetch playlist',
      };
    }
  }

  async createPlaylist(data: CreatePlaylistRequest): Promise<ApiResponse<Playlist>> {
    try {
      const response = await this.requestRaw<PlaylistDto>(`${API_V1_PREFIX}/playlists`, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      return {
        success: true,
        data: mapPlaylist(response),
      };
    } catch {
      return {
        success: false,
        error: 'Failed to create playlist',
      };
    }
  }

  async updatePlaylist(playlistId: string, data: UpdatePlaylistRequest): Promise<ApiResponse<Playlist>> {
    try {
      const response = await this.requestRaw<PlaylistDto>(`${API_V1_PREFIX}/playlists/${playlistId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });

      return {
        success: true,
        data: mapPlaylist(response),
      };
    } catch {
      return {
        success: false,
        error: 'Failed to update playlist',
      };
    }
  }

  async deletePlaylist(playlistId: string): Promise<ApiResponse<void>> {
    try {
      await this.requestRaw<void>(`${API_V1_PREFIX}/playlists/${playlistId}`, {
        method: 'DELETE',
      });

      return {
        success: true,
        data: undefined,
      };
    } catch {
      return {
        success: false,
        error: 'Failed to delete playlist',
      };
    }
  }

  async getPlaylistVideos(
    playlistId: string,
    filters: Pick<PlaylistListFilters, 'page' | 'pageSize'> = {}
  ): Promise<ApiResponse<PlaylistVideosPage>> {
    try {
      const params = new URLSearchParams();
      appendQueryParam(params, 'page', filters.page ?? 1);
      appendQueryParam(params, 'pageSize', filters.pageSize ?? 24);

      const response = await this.requestRaw<PlaylistVideosPageDto>(
        `${API_V1_PREFIX}/playlists/${playlistId}/videos?${params.toString()}`
      );

      return {
        success: true,
        data: mapPlaylistVideosPage(response),
      };
    } catch {
      return {
        success: false,
        error: 'Failed to fetch playlist videos',
      };
    }
  }

  async addVideoToPlaylist(
    playlistId: string,
    data: AddPlaylistVideoRequest
  ): Promise<ApiResponse<void>> {
    try {
      await this.requestRaw<void>(`${API_V1_PREFIX}/playlists/${playlistId}/videos`, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      return {
        success: true,
        data: undefined,
      };
    } catch {
      return {
        success: false,
        error: 'Failed to add video to playlist',
      };
    }
  }

  async removeVideoFromPlaylist(playlistId: string, videoId: string): Promise<ApiResponse<void>> {
    try {
      await this.requestRaw<void>(`${API_V1_PREFIX}/playlists/${playlistId}/videos/${videoId}`, {
        method: 'DELETE',
      });

      return {
        success: true,
        data: undefined,
      };
    } catch {
      return {
        success: false,
        error: 'Failed to remove video from playlist',
      };
    }
  }

  async reorderPlaylistVideos(
    playlistId: string,
    data: ReorderPlaylistVideosRequest
  ): Promise<ApiResponse<void>> {
    try {
      await this.requestRaw<void>(`${API_V1_PREFIX}/playlists/${playlistId}/videos/reorder`, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      return {
        success: true,
        data: undefined,
      };
    } catch {
      return {
        success: false,
        error: 'Failed to reorder playlist videos',
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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
      categoryId: string | null;
      tagIds: string[];
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
    } catch {
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
    } catch {
      return {
        success: false,
        error: 'Failed to archive video',
      };
    }
  }
}

export const apiClient = new ApiClient();

