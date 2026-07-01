'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { AuthenticatedThumbnail } from '@/shared/components/AuthenticatedThumbnail';
import { VideoPlayer } from '@/features/videos/components/VideoPlayer';
import { CommentsSection } from '@/features/videos/components/CommentsSection';
import { TranscriptPanel } from '@/features/videos/components/TranscriptPanel';
import { apiClient } from '@/shared/lib/api';
import { capitalize, cn } from '@/shared/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Share2,
  ListPlus,
  ThumbsUp,
  ThumbsDown,
  Shield,
  Clock,
  AlertCircle,
  Trash2,
  BarChart2,
  FileText,
} from 'lucide-react';
import { Bookmark as BookmarkType } from '@/features/bookmarks/types';
import {
  ReactionSummary,
  ReactionType,
  TranscriptChunk,
  TranscriptSearchResult,
  Video,
  VideoProcessingStatus,
  VideoTranscription,
} from '@/features/videos/types';
import { useAuth } from '@/features/auth/AuthContext';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import { Playlist } from '@/features/playlists/types';
import { VideoVisibilityBadge } from '@/features/videos/components/VideoVisibilityBadge';
import { VideoStatusBadge } from '@/features/videos/components/VideoStatusBadge';
import VideoStatsModal from '@/features/videos/components/VideoStatsModal';
import { UserRole } from '@/features/auth/types';
import { resolveActiveView, getAllowedViews, ACTIVE_VIEW_CHANGE_EVENT } from '@/shared/lib/viewMode';
import {
  buildTranscriptionDownloadName,
  convertSrtToVtt,
  getTranscriptionLanguageLabel,
  isActiveTranscription,
  normalizeTranscriptionStatus,
  selectPrimaryTranscription,
} from '@/features/videos/lib/transcriptions';

const ACTIVE_PROCESSING_STATUSES = new Set(['Uploading', 'Processing']);
const PROCESSING_POLL_INTERVAL_MS = 4000;
const TRANSCRIPTION_POLL_INTERVAL_MS = 7000;

type CaptionTrack = {
  id: string;
  label: string;
  src: string;
  srcLang: string;
  isDefault?: boolean;
};

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return `${minutes}:${String(secs).padStart(2, '0')}`;
};

export default function WatchVideoPage({ videoId }: { videoId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playlistId = searchParams.get('playlistId');
  const shareToken = searchParams.get('shareToken') ?? undefined;
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [playlistVideos, setPlaylistVideos] = useState<Video[]>([]);
  const [autoplay, setAutoplay] = useState(true);
  const [isAutoplayLoaded, setIsAutoplayLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('streamforge_playlist_autoplay');

    queueMicrotask(() => {
      if (stored !== null) {
        setAutoplay(stored === 'true');
      }
      setIsAutoplayLoaded(true);
    });
  }, []);

  const handleAutoplayChange = (value: boolean) => {
    setAutoplay(value);
    localStorage.setItem('streamforge_playlist_autoplay', String(value));
  };
  const { user, token } = useAuth();
  const isGuest = !user;
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [processingStatus, setProcessingStatus] = useState<VideoProcessingStatus | null>(null);
  const [reactionSummary, setReactionSummary] = useState<ReactionSummary | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [transcriptions, setTranscriptions] = useState<VideoTranscription[]>([]);
  const [selectedTranscriptionId, setSelectedTranscriptionId] = useState<string | null>(null);
  const [transcriptChunks, setTranscriptChunks] = useState<TranscriptChunk[]>([]);
  const [transcriptSearchQuery, setTranscriptSearchQuery] = useState('');
  const [transcriptSearchResults, setTranscriptSearchResults] = useState<TranscriptSearchResult[]>([]);
  const [hasCompletedTranscriptSearch, setHasCompletedTranscriptSearch] = useState(false);
  const [captionTracks, setCaptionTracks] = useState<CaptionTrack[]>([]);
  const [selectedCaptionId, setSelectedCaptionId] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookmarkSaving, setIsBookmarkSaving] = useState(false);
  const [isReactionSaving, setIsReactionSaving] = useState(false);
  const [isTranscriptLoading, setIsTranscriptLoading] = useState(false);
  const [isTranscriptSearching, setIsTranscriptSearching] = useState(false);
  const [isPlaylistsLoading, setIsPlaylistsLoading] = useState(false);
  const [isPlaylistDialogOpen, setIsPlaylistDialogOpen] = useState(false);
  const [isPlaylistSaving, setIsPlaylistSaving] = useState(false);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [highlightedChunkId, setHighlightedChunkId] = useState<string | null>(null);
  const [requestedSeekTime, setRequestedSeekTime] = useState<number | null>(null);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const captionUrlsRef = useRef<string[]>([]);

  const resolvedView = React.useMemo(() => (user ? resolveActiveView(user.role, null) : null), [user]);
  const [activeView, setActiveView] = useState<UserRole | null>(resolvedView);
  const browserLanguage = typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'en';

  useEffect(() => {
    const handleViewChange = (event: Event) => {
      const nextView = (event as CustomEvent<UserRole>).detail;
      if (user && getAllowedViews(user.role).includes(nextView)) {
        setActiveView(nextView);
      }
    };

    window.addEventListener(ACTIVE_VIEW_CHANGE_EVENT, handleViewChange);
    return () => window.removeEventListener(ACTIVE_VIEW_CHANGE_EVENT, handleViewChange);
  }, [user]);

  const requestSeek = useCallback((seconds: number) => {
    setRequestedSeekTime(null);
    window.requestAnimationFrame(() => {
      setRequestedSeekTime(seconds);
    });
  }, []);

  const handleTranscriptSearchQueryChange = useCallback((value: string) => {
    setTranscriptSearchQuery(value);
    setHasCompletedTranscriptSearch(false);

    if (!value.trim()) {
      setTranscriptSearchResults([]);
      setIsTranscriptSearching(false);
    }
  }, []);

  const applyLoadedTranscriptions = useCallback((nextTranscriptions: VideoTranscription[]) => {
    setTranscriptions(nextTranscriptions);

    if (nextTranscriptions.length === 0) {
      setIsTranscriptOpen(false);
      setSelectedTranscriptionId(null);
      setTranscriptChunks([]);
      setTranscriptSearchResults([]);
      return nextTranscriptions;
    }

    setSelectedTranscriptionId((current) => {
      if (current && nextTranscriptions.some((transcription) => transcription.id === current)) {
        return current;
      }

      return selectPrimaryTranscription(nextTranscriptions, browserLanguage)?.id ?? null;
    });

    return nextTranscriptions;
  }, [browserLanguage]);

  const loadVideo = useCallback(async ({ showLoading = false }: { showLoading?: boolean } = {}) => {
    if (showLoading) {
      setIsLoading(true);
    }

    setError(null);

    const [videoResponse, relatedResponse, reactionResponse, bookmarksResponse] = await Promise.all([
      apiClient.getVideoById(videoId),
      apiClient.getVideos({
        status: 'Ready',
        visibility: 'Public',
        page: 1,
        pageSize: 4,
      }),
      apiClient.getReactionSummary(videoId),
      user
        ? apiClient.getVideoBookmarks(videoId, { page: 1, pageSize: 20 })
        : Promise.resolve({ success: true, data: { items: [] } }),
    ]);

    if (videoResponse.success && videoResponse.data) {
      setVideo(videoResponse.data);
      setRelatedVideos((relatedResponse.data?.items ?? []).filter((relatedVideo) => relatedVideo.id !== videoId));
      setReactionSummary(reactionResponse.data ?? null);
      setBookmarks(bookmarksResponse.data?.items ?? []);

      if (!videoResponse.data.status || videoResponse.data.status === 'Ready') {
        setProcessingStatus(null);
      }
    } else {
      setVideo(null);
      setRelatedVideos([]);
      setReactionSummary(null);
      setBookmarks([]);
      setProcessingStatus(null);
      setError(videoResponse.error ?? 'Failed to load video');
    }

    if (showLoading) {
      setIsLoading(false);
    }

    return videoResponse.data ?? null;
  }, [videoId, user]);

  const loadTranscriptions = useCallback(async () => {
    const response = await apiClient.getVideoTranscriptions(videoId, { shareToken });

    if (response.success && response.data) {
      return applyLoadedTranscriptions(response.data);
    }

    applyLoadedTranscriptions([]);
    return [];
  }, [applyLoadedTranscriptions, shareToken, videoId]);

  const handleDownloadTranscription = useCallback(async (transcription: VideoTranscription) => {
    if (!video) {
      return;
    }

    const response = await apiClient.downloadVideoTranscriptionArtifact(video.id, transcription.id, { shareToken });
    if (!response.success || !response.data) {
      toast.error(response.error ?? 'Failed to download transcription');
      return;
    }

    const objectUrl = URL.createObjectURL(response.data.blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = buildTranscriptionDownloadName(video.title, transcription.language, transcription.format);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  }, [shareToken, video]);

  const handleTranscriptSearch = useCallback(async () => {
    if (!video || !transcriptSearchQuery.trim()) {
      setTranscriptSearchResults([]);
      setHasCompletedTranscriptSearch(false);
      return;
    }

    setIsTranscriptSearching(true);

    const response = await apiClient.searchVideoTranscript(video.id, {
      q: transcriptSearchQuery.trim(),
      language:
        transcriptions.find((transcription) => transcription.id === selectedTranscriptionId)?.language ?? undefined,
      page: 1,
      pageSize: 20,
      shareToken,
    });

    if (response.success && response.data) {
      setTranscriptSearchResults(response.data.items);
      setHasCompletedTranscriptSearch(true);
      setIsTranscriptOpen(true);
    } else {
      setTranscriptSearchResults([]);
      setHasCompletedTranscriptSearch(true);
      toast.error(response.error ?? 'Failed to search transcript');
    }

    setIsTranscriptSearching(false);
  }, [selectedTranscriptionId, shareToken, transcriptSearchQuery, transcriptions, video]);

  useEffect(() => {
    if (!isTranscriptOpen) {
      return;
    }

    if (!transcriptSearchQuery.trim()) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void handleTranscriptSearch();
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [handleTranscriptSearch, isTranscriptOpen, transcriptSearchQuery]);

  useEffect(() => {
    if (!playlistId) {
      queueMicrotask(() => {
        setPlaylist(null);
        setPlaylistVideos([]);
      });
      return;
    }

    let isMounted = true;

    const loadPlaylistQueue = async () => {
      const [playlistRes, videosRes] = await Promise.all([
        apiClient.getPlaylistById(playlistId),
        apiClient.getPlaylistVideos(playlistId, { page: 1, pageSize: 100 }),
      ]);

      if (!isMounted) return;

      if (playlistRes.success && playlistRes.data) {
        setPlaylist(playlistRes.data);
      }
      if (videosRes.success && videosRes.data) {
        setPlaylistVideos(videosRes.data.videos.items);
      }
    };

    void loadPlaylistQueue();

    return () => {
      isMounted = false;
    };
  }, [playlistId]);

  useEffect(() => {
    let isMounted = true;

    const loadInitialVideo = async () => {
      const loadedVideo = await loadVideo({ showLoading: true });
      await loadTranscriptions();

      if (!isMounted || !loadedVideo?.status || !ACTIVE_PROCESSING_STATUSES.has(loadedVideo.status)) {
        return;
      }

      const processingResponse = await apiClient.getVideoProcessingStatus(videoId);

      if (isMounted && processingResponse.success && processingResponse.data) {
        setProcessingStatus(processingResponse.data);
      }
    };

    void loadInitialVideo();

    return () => {
      isMounted = false;
    };
  }, [loadTranscriptions, loadVideo, videoId]);

  useEffect(() => {
    if (!video?.status || !ACTIVE_PROCESSING_STATUSES.has(video.status)) {
      return;
    }

    let isMounted = true;

    const pollProcessingStatus = async () => {
      const processingResponse = await apiClient.getVideoProcessingStatus(videoId);

      if (!isMounted) {
        return;
      }

      if (processingResponse.success && processingResponse.data) {
        setProcessingStatus(processingResponse.data);

        if (processingResponse.data.videoStatus === 'Ready') {
          await loadVideo();
          return;
        }

        if (!ACTIVE_PROCESSING_STATUSES.has(processingResponse.data.videoStatus)) {
          setVideo((currentVideo) =>
            currentVideo ? { ...currentVideo, status: processingResponse.data?.videoStatus } : currentVideo
          );
        }
      }
    };

    const intervalId = window.setInterval(() => {
      void pollProcessingStatus();
    }, PROCESSING_POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [loadVideo, video?.status, videoId]);

  useEffect(() => {
    if (!selectedTranscriptionId || !video) {
      return;
    }

    let isMounted = true;

    const loadChunks = async () => {
      setIsTranscriptLoading(true);
      const response = await apiClient.getVideoTranscriptionChunks(video.id, selectedTranscriptionId, { shareToken });

      if (!isMounted) {
        return;
      }

      if (response.success && response.data) {
        setTranscriptChunks(response.data);
      } else {
        setTranscriptChunks([]);
        setError(response.error ?? 'Failed to load transcript');
      }

      setIsTranscriptLoading(false);
    };

    void loadChunks();

    return () => {
      isMounted = false;
    };
  }, [selectedTranscriptionId, shareToken, video]);

  useEffect(() => {
    const completedTranscriptions = transcriptions.filter(
      (transcription) => normalizeTranscriptionStatus(transcription) === 'success'
    );

    if (completedTranscriptions.length === 0 || !video) {
      void Promise.resolve().then(() => {
        captionUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        captionUrlsRef.current = [];
        setCaptionTracks([]);
        setSelectedCaptionId(null);
      });
      return;
    }

    let isMounted = true;

    const groupedByLanguage = new Map<string, VideoTranscription[]>();
    completedTranscriptions.forEach((transcription) => {
      const key = transcription.language?.toLowerCase() || 'auto';
      const group = groupedByLanguage.get(key) ?? [];
      group.push(transcription);
      groupedByLanguage.set(key, group);
    });

    const loadCaptions = async () => {
      const selectedArtifacts = Array.from(groupedByLanguage.values())
        .map((group) => selectPrimaryTranscription(group, group[0]?.language ?? undefined))
        .filter((value): value is VideoTranscription => Boolean(value));

      const nextCaptionTracks: CaptionTrack[] = [];
      const nextUrls: string[] = [];

      for (const transcription of selectedArtifacts) {
        const response = await apiClient.getVideoTranscriptionArtifactText(video.id, transcription.id, { shareToken });
        if (!response.success || !response.data) {
          continue;
        }

        const format = transcription.format?.toUpperCase() ?? 'VTT';
        const content = format === 'SRT' ? convertSrtToVtt(response.data.content) : response.data.content;
        const blob = new Blob([content], { type: 'text/vtt' });
        const objectUrl = URL.createObjectURL(blob);
        nextUrls.push(objectUrl);
        nextCaptionTracks.push({
          id: transcription.id,
          label: getTranscriptionLanguageLabel(transcription.language),
          src: objectUrl,
          srcLang: transcription.language || 'en',
        });
      }

      if (!isMounted) {
        nextUrls.forEach((url) => URL.revokeObjectURL(url));
        return;
      }

      captionUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      captionUrlsRef.current = nextUrls;
      setCaptionTracks(nextCaptionTracks);
      setSelectedCaptionId((current) => {
        if (current && nextCaptionTracks.some((track) => track.id === current)) {
          return current;
        }

        const primaryTrack = nextCaptionTracks.find((track) => track.id === selectedTranscriptionId);
        return primaryTrack?.id ?? nextCaptionTracks[0]?.id ?? null;
      });
    };

    void loadCaptions();

    return () => {
      isMounted = false;
    };
  }, [selectedTranscriptionId, shareToken, transcriptions, video]);

  useEffect(() => {
    if (!transcriptions.some(isActiveTranscription)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadTranscriptions();
    }, TRANSCRIPTION_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadTranscriptions, transcriptions]);

  const handleBookmarkAdd = async (timestamp: number, note?: string) => {
    if (!video) {
      return;
    }

    setIsBookmarkSaving(true);

    const response = await apiClient.createBookmark(video.id, {
      timestampSeconds: Math.floor(timestamp),
      note: note ?? null,
    });

    if (response.success && response.data) {
      setBookmarks((current) => [response.data!, ...current.filter((bookmark) => bookmark.id !== response.data?.id)]);
      toast.success('Bookmark saved successfully');
    } else {
      toast.error(response.error ?? 'Failed to save bookmark');
    }

    setIsBookmarkSaving(false);
  };

  const loadPlaylists = useCallback(async () => {
    if (isGuest) return;
    setIsPlaylistsLoading(true);
    setError(null);

    const response = await apiClient.getMyPlaylists({ page: 1, pageSize: 50 });

    if (response.success && response.data) {
      setPlaylists(response.data.items);
    } else {
      setPlaylists([]);
      setError(response.error ?? 'Failed to load playlists');
    }

    setIsPlaylistsLoading(false);
  }, [isGuest]);

  const handlePlaylistDialogChange = async (open: boolean) => {
    if (isGuest) return;
    setIsPlaylistDialogOpen(open);

    if (open && playlists.length === 0 && !isPlaylistsLoading) {
      await loadPlaylists();
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!video) {
      return;
    }

    setIsPlaylistSaving(true);

    const response = await apiClient.addVideoToPlaylist(playlistId, {
      videoId: video.id,
    });

    if (response.success) {
      const targetPlaylist = playlists.find((playlist) => playlist.id === playlistId);
      setPlaylists((current) =>
        current.map((playlist) =>
          playlist.id === playlistId
            ? { ...playlist, videoCount: playlist.videoCount + 1 }
            : playlist
        )
      );
      toast.success(`Added to ${targetPlaylist?.name ?? 'playlist'}`);
      setIsPlaylistDialogOpen(false);
    } else {
      toast.error(response.error ?? 'Failed to add video to playlist');
    }

    setIsPlaylistSaving(false);
  };

  const handleReaction = async (nextReaction: ReactionType) => {
    if (!video) {
      return;
    }

    setIsReactionSaving(true);
    setError(null);

    const response =
      reactionSummary?.currentUserReaction === nextReaction
        ? await apiClient.clearReaction(video.id)
        : await apiClient.setReaction(video.id, { reactionType: nextReaction });

    if (response.success && response.data) {
      setReactionSummary(response.data);
      toast.success(
        nextReaction === 'Like' ? 'Liked video' : 'Disliked video'
      );
    } else {
      toast.error(response.error ?? 'Failed to update reaction');
    }

    setIsReactionSaving(false);
  };

  const handleTranscriptResultSeek = useCallback((result: TranscriptSearchResult) => {
    setSelectedTranscriptionId(result.transcriptionId);
    setHighlightedChunkId(result.chunkId);
    setIsTranscriptOpen(true);
    requestSeek(result.startSeconds);
  }, [requestSeek]);

  const handlePlaylistVideoEnded = useCallback(() => {
    if (!autoplay || !playlistId || playlistVideos.length === 0) return;

    const currentIndex = playlistVideos.findIndex((v) => v.id === videoId);
    if (currentIndex !== -1 && currentIndex + 1 < playlistVideos.length) {
      const nextVideo = playlistVideos[currentIndex + 1];
      router.push(`/videos/${nextVideo.id}?playlistId=${playlistId}`);
    }
  }, [autoplay, playlistId, playlistVideos, videoId, router]);

  const isLiked = reactionSummary?.currentUserReaction === 'Like';
  const isDisliked = reactionSummary?.currentUserReaction === 'Dislike';
  const isOwner = !!(user && video && user.id === video.uploaderId);
  const canManageVideo = activeView !== 'viewer' && (user?.role === 'admin' || (user?.role === 'editor' && isOwner));
  const hasTranscriptions = transcriptions.length > 0;

  useEffect(() => {
    return () => {
      captionUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      captionUrlsRef.current = [];
    };
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout title="Watch Video" allowGuests={true}>
        <Card className="overflow-hidden py-0">
          <CardContent className="flex aspect-video items-center justify-center p-0 text-center">
            <p className="text-muted-foreground">Loading video...</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (error || !video) {
    return (
      <DashboardLayout title="Watch Video" allowGuests={true}>
        <Card className="border-destructive/40 bg-destructive/5 py-16 text-center">
          <CardContent className="space-y-4">
            <p className="font-medium text-destructive">{error ?? 'Video not found'}</p>
            <Button variant="outline" onClick={() => router.push('/explore')}>
              Back to Explore
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const isVideoReady = video.status === 'Ready' || !video.status;
  const isVideoFailed = video.status === 'Failed';
  const isVideoDeleted = video.status === 'Deleted';
  const isProcessing = video.status ? ACTIVE_PROCESSING_STATUSES.has(video.status) : false;
  const processingProgress = processingStatus?.progress ?? 0;
  const selectedActionButtonClass = 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15';

  return (
    <DashboardLayout title="Watch Video" allowGuests={true}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-6">
            {isVideoReady ? (
              <VideoPlayer
                videoId={video.id}
                hlsUrl={video.hlsUrl}
                title={video.title}
                duration={video.duration}
                authToken={token}
                bookmarks={bookmarks}
                captions={captionTracks}
                selectedCaptionId={selectedCaptionId}
                onCaptionChange={setSelectedCaptionId}
                onBookmarkAdd={handleBookmarkAdd}
                isBookmarkSaving={isBookmarkSaving}
                onEnded={handlePlaylistVideoEnded}
                autoPlay={isAutoplayLoaded && autoplay && !!playlistId}
                requestedSeekTime={requestedSeekTime}
                onPlaybackTimeChange={setCurrentPlaybackTime}
              />
            ) : (
              <div className="relative aspect-video w-full rounded-lg bg-card border border-border text-foreground flex flex-col items-center justify-center gap-4 p-6 text-center overflow-hidden">
                {isVideoDeleted ? (
                  <>
                    <div className="relative flex items-center justify-center rounded-full bg-muted border border-border size-12">
                      <Trash2 className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-muted-foreground">
                        Video Deleted
                      </h2>
                      <p className="text-[11px] text-muted-foreground max-w-[280px] mt-1 leading-normal">
                        This video has been deleted and is no longer available.
                      </p>
                    </div>
                  </>
                ) : isVideoFailed ? (
                  <>
                    <div className="relative flex items-center justify-center rounded-full bg-destructive/10 border border-destructive/20 size-12">
                      <AlertCircle className="size-5 text-destructive" />
                    </div>
                    <div>
                      <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-destructive/90">
                        Processing Error
                      </h2>
                      <p className="text-[11px] text-muted-foreground max-w-[280px] mt-1 leading-normal">
                        Playback is unavailable because this video could not be ingested.
                      </p>
                    </div>
                    {processingStatus?.errorMessage && (
                      <p className="max-w-md text-[10px] font-mono text-destructive/80 mt-1 border border-destructive/20 bg-destructive/5 rounded px-2 py-1">
                        {processingStatus.errorMessage}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="relative flex items-center justify-center size-12">
                      <div className="absolute inset-0 rounded-full border border-muted border-t-primary animate-spin" />
                      <Clock className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-muted-foreground">
                        Video is processing
                      </h2>
                      <p className="text-[11px] text-muted-foreground max-w-[280px] mt-1 leading-normal">
                        Playback will be available once transcoding and analysis complete.
                      </p>
                    </div>
                    
                    <div className="w-full max-w-xs space-y-1.5 mt-2">
                      <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                        <span>[TASK: {processingStatus?.jobType || 'Video processing'}]</span>
                        <span className="font-semibold text-foreground">
                          {processingStatus?.progress !== null && processingStatus?.progress !== undefined
                            ? `${processingStatus.progress}%`
                            : 'Pending'}
                        </span>
                      </div>
                      <Progress value={processingProgress} className="h-1 bg-muted" />
                    </div>
                  </>
                )}

                {/* Operator Logs Panel */}
                {!isVideoDeleted && (
                  <div className="font-mono text-[9px] text-muted-foreground bg-muted/30 border border-border rounded p-2.5 max-w-xs w-full text-left space-y-0.5 mt-2">
                    <div>JOB_ID   : {processingStatus?.processingJobId || 'PENDING'}</div>
                    <div>STAGE    : {processingStatus?.jobStatus || (isVideoFailed ? 'FAILED' : 'INGESTING')}</div>
                    <div>START    : {processingStatus?.startedAt ? new Date(processingStatus.startedAt).toLocaleTimeString() : 'N/A'}</div>
                  </div>
                )}
              </div>
            )}

            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">{video.title}</h1>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <InitialsAvatar name={video.uploadedBy} />
                  <div>
                    <p className="text-sm font-semibold leading-tight text-foreground">{video.uploadedBy}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Uploaded {video.uploadedAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="ml-auto flex flex-wrap items-center gap-1 text-xs">
                  {video.allowLikes !== false && (
                    <>
                      <button
                        onClick={() => void handleReaction('Like')}
                        disabled={isGuest || isReactionSaving || isProcessing || isVideoDeleted}
                        title={isGuest ? 'Sign in to like this video' : undefined}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                          isLiked ? `${selectedActionButtonClass} font-semibold` : 'bg-transparent'
                        } ${
                          isLiked ? '' : 'text-foreground'
                        }`}
                      >
                        <ThumbsUp className={`size-3.5 ${isLiked ? 'fill-current' : ''}`} />
                        <span className="font-mono">{reactionSummary?.likeCount ?? 0}</span>
                      </button>
                      <button
                        onClick={() => void handleReaction('Dislike')}
                        disabled={isGuest || isReactionSaving || isProcessing || isVideoDeleted}
                        title={isGuest ? 'Sign in to dislike this video' : undefined}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                          isDisliked ? `${selectedActionButtonClass} font-semibold` : 'bg-transparent'
                        } ${
                          isDisliked ? '' : 'text-foreground'
                        }`}
                      >
                        <ThumbsDown className={`size-3.5 ${isDisliked ? 'fill-current' : ''}`} />
                        <span className="font-mono">{reactionSummary?.dislikeCount ?? 0}</span>
                      </button>
                    </>
                  )}
                  {video.allowBookmarks !== false && (
                    <Dialog open={isPlaylistDialogOpen} onOpenChange={(open) => void handlePlaylistDialogChange(open)}>
                      <DialogTrigger asChild>
                        <button
                          disabled={isGuest || isProcessing || isVideoDeleted}
                          title={isGuest ? 'Sign in to save to playlists' : undefined}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors text-xs font-medium text-foreground bg-transparent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ListPlus className="size-3.5" />
                          Save
                        </button>
                      </DialogTrigger>
                      <DialogContent className="border border-border bg-background sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Save to Playlist</DialogTitle>
                          <DialogDescription>
                            Choose a playlist to save this video for later.
                          </DialogDescription>
                        </DialogHeader>

                        {isPlaylistsLoading ? (
                          <div className="py-6 text-sm text-muted-foreground">Loading playlists...</div>
                        ) : playlists.length > 0 ? (
                          <div className="space-y-3">
                            {playlists.map((playlist) => (
                              <button
                                key={playlist.id}
                                type="button"
                                className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition hover:bg-muted animate-none duration-0 cursor-pointer"
                                onClick={() => void handleAddToPlaylist(playlist.id)}
                                disabled={isPlaylistSaving}
                              >
                                <div>
                                  <p className="font-medium text-foreground">{playlist.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {playlist.videoCount} videos, {playlist.visibility.toLowerCase()}
                                  </p>
                                </div>
                                <span className="text-sm text-primary">
                                  {isPlaylistSaving ? 'Saving...' : 'Add'}
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-3 py-2">
                            <p className="text-sm text-muted-foreground">
                              You do not have any playlists yet.
                            </p>
                            <Button onClick={() => router.push('/playlists')}>Go to Playlists</Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  )}
                  {hasTranscriptions ? (
                    <button
                      onClick={() => setIsTranscriptOpen((current) => !current)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors text-xs font-medium cursor-pointer ${
                        isTranscriptOpen ? `${selectedActionButtonClass} font-semibold` : ''
                      } ${
                        isTranscriptOpen ? '' : 'bg-transparent text-foreground'
                      }`}
                    >
                      <FileText className="size-3.5" />
                      Transcript
                    </button>
                  ) : null}
                  <button
                    disabled={isProcessing || isVideoDeleted}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors text-xs font-medium text-foreground bg-transparent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Share2 className="size-3.5" />
                    Share
                  </button>
                  {canManageVideo && (
                    <button
                      onClick={() => setStatsDialogOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors text-xs font-medium text-foreground bg-transparent cursor-pointer"
                    >
                      <BarChart2 className="size-3.5" />
                      Stats
                    </button>
                  )}
                  {canManageVideo && (
                    <button
                      onClick={() => router.push(`/videos/${video.id}/manage`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors text-xs font-medium text-foreground bg-transparent cursor-pointer"
                    >
                      <Shield className="size-3.5" />
                      Manage
                    </button>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground mt-3 font-mono">
                {video.views} views · {video.categories[0] ? capitalize(video.categories[0]) : 'Uncategorized'} · {video.tags.map((tag) => `#${tag}`).join(' ')}
              </p>
            </div>



            <div className="space-y-4 text-foreground">
              <p className="text-sm leading-relaxed">{video.description}</p>
              <div className="flex flex-wrap gap-2">
                <VideoVisibilityBadge visibility={video.visibility} />
                {video.status ? <VideoStatusBadge status={video.status} /> : null}
                {video.categories.slice(1).map((category) => (
                  <Badge key={category} variant="secondary">
                    {capitalize(category)}
                  </Badge>
                ))}
                {video.tags.slice(3).map((tag) => (
                  <Badge key={tag} variant="outline">
                    #{capitalize(tag)}
                  </Badge>
                ))}
              </div>
            </div>

            {video.allowComments !== false && !isProcessing && !isVideoDeleted && (
              <CommentsSection
                videoId={video.id}
                currentUserId={user?.id}
                showCard={false}
                showDescription={false}
              />
            )}
          </div>

          <aside className="space-y-6">
            {hasTranscriptions && isTranscriptOpen && (
              <TranscriptPanel
                transcriptions={transcriptions}
                selectedTranscriptionId={selectedTranscriptionId}
                transcriptChunks={transcriptChunks}
                isTranscriptLoading={isTranscriptLoading}
                transcriptSearchQuery={transcriptSearchQuery}
                onTranscriptSearchQueryChange={handleTranscriptSearchQueryChange}
                onTranscriptSearch={() => void handleTranscriptSearch()}
                transcriptSearchResults={transcriptSearchResults}
                isTranscriptSearching={isTranscriptSearching}
                hasCompletedTranscriptSearch={hasCompletedTranscriptSearch}
                highlightedChunkId={highlightedChunkId}
                onChunkSeek={(chunk) => {
                  setHighlightedChunkId(chunk.chunkId);
                  requestSeek(chunk.startSeconds);
                }}
                onSearchResultSeek={handleTranscriptResultSeek}
                onDownloadTranscription={(transcription) => void handleDownloadTranscription(transcription)}
                isOpen={isTranscriptOpen}
                onClose={() => setIsTranscriptOpen(false)}
                currentPlaybackTime={currentPlaybackTime}
              />
            )}
            {playlistId && playlist && (
              <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                <div className="border-b border-border pb-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Playlist Queue</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground font-mono">Autoplay</span>
                        <Switch
                          checked={isAutoplayLoaded ? autoplay : true}
                          onCheckedChange={handleAutoplayChange}
                          className="scale-75 origin-left"
                        />
                      </div>
                      <span className="text-[10px] font-mono text-foreground/80 bg-muted px-1.5 py-0.5 rounded shrink-0">
                        {playlistVideos.length} videos
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/playlists?playlistId=${playlist.id}`}
                      className="text-xs font-semibold truncate text-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                      {playlist.name}
                    </Link>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {playlistVideos.map((pv, idx) => {
                    const isActive = pv.id === videoId;
                    return (
                      <Link
                        key={pv.id}
                        href={`/videos/${pv.id}?playlistId=${playlistId}`}
                        className={cn(
                          'w-full text-left flex items-center gap-3 p-2 rounded transition-colors group cursor-pointer',
                          isActive ? 'bg-accent/80' : 'hover:bg-accent/45'
                        )}
                      >
                        <span className="text-[10px] font-mono text-muted-foreground w-4 text-right shrink-0">
                          {idx + 1}
                        </span>
                        <div className="relative w-16 aspect-video shrink-0 rounded ring-1 ring-border overflow-hidden bg-black">
                          <AuthenticatedThumbnail
                            src={pv.thumbnail || '/placeholder.svg'}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'text-xs leading-snug line-clamp-1 font-semibold truncate',
                              isActive ? 'text-primary' : 'text-foreground group-hover:text-primary transition-colors'
                            )}
                          >
                            {pv.title}
                          </p>
                          <p className={cn(
                            'text-[9px] truncate mt-0.5',
                            isActive ? 'text-foreground/75' : 'text-muted-foreground'
                          )}>
                            {pv.uploadedBy}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-3 text-muted-foreground">Related Videos</h3>
              <div className="space-y-4">
                {relatedVideos.map((relatedVideo) => (
                  <Link
                    key={relatedVideo.id}
                    href={`/videos/${relatedVideo.id}`}
                    className="flex gap-3 text-left w-full group cursor-pointer"
                  >
                    <div className="relative w-32 aspect-video shrink-0 rounded ring-1 ring-border overflow-hidden bg-black">
                      <AuthenticatedThumbnail
                        src={relatedVideo.thumbnail || '/placeholder.svg'}
                        alt={relatedVideo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {relatedVideo.duration !== undefined && (
                        <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 text-[9px] font-mono text-white rounded">
                          {formatTime(relatedVideo.duration)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                        {relatedVideo.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">
                        {relatedVideo.uploadedBy} · {relatedVideo.views} views
                      </p>
                    </div>
                  </Link>
                ))}
                {relatedVideos.length === 0 && (
                  <p className="text-xs text-muted-foreground">No related videos found.</p>
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* Video Statistics Modal */}
        {video && (
          <VideoStatsModal
            videoId={video.id}
            videoTitle={video.title}
            isOpen={statsDialogOpen}
            onOpenChange={setStatsDialogOpen}
          />
        )}

      </DashboardLayout>
    );
}
