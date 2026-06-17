'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { VideoPlayer } from '@/features/videos/components/VideoPlayer';
import { CommentsSection } from '@/features/videos/components/CommentsSection';
import { apiClient } from '@/shared/lib/api';
import { capitalize } from '@/shared/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
  Eye,
  Calendar,
  Shield,
  Clock,
} from 'lucide-react';
import { Bookmark as BookmarkType } from '@/features/bookmarks/types';
import { ReactionSummary, ReactionType, Video, VideoProcessingStatus } from '@/features/videos/types';
import { useAuth } from '@/features/auth/AuthContext';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import { Playlist } from '@/features/playlists/types';
import { VideoVisibilityBadge } from '@/features/videos/components/VideoVisibilityBadge';
import { VideoStatusBadge } from '@/features/videos/components/VideoStatusBadge';
import { VideoCard } from '@/features/videos/components/VideoCard';

const ACTIVE_PROCESSING_STATUSES = new Set(['Uploading', 'Processing']);
const PROCESSING_POLL_INTERVAL_MS = 4000;

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
  const { user } = useAuth();
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [processingStatus, setProcessingStatus] = useState<VideoProcessingStatus | null>(null);
  const [reactionSummary, setReactionSummary] = useState<ReactionSummary | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookmarkSaving, setIsBookmarkSaving] = useState(false);
  const [isReactionSaving, setIsReactionSaving] = useState(false);
  const [isPlaylistsLoading, setIsPlaylistsLoading] = useState(false);
  const [isPlaylistDialogOpen, setIsPlaylistDialogOpen] = useState(false);
  const [isPlaylistSaving, setIsPlaylistSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkMessage, setBookmarkMessage] = useState<string | null>(null);
  const [playlistMessage, setPlaylistMessage] = useState<string | null>(null);

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
      apiClient.getVideoBookmarks(videoId, { page: 1, pageSize: 20 }),
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
  }, [videoId]);

  useEffect(() => {
    let isMounted = true;

    const loadInitialVideo = async () => {
      const loadedVideo = await loadVideo({ showLoading: true });

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
  }, [loadVideo, videoId]);

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

  const handleBookmarkAdd = async (timestamp: number, note?: string) => {
    if (!video) {
      return;
    }

    setIsBookmarkSaving(true);
    setBookmarkMessage(null);

    const response = await apiClient.createBookmark(video.id, {
      timestampSeconds: Math.floor(timestamp),
      note: note ?? null,
    });

    if (response.success && response.data) {
      setBookmarks((current) => [response.data!, ...current.filter((bookmark) => bookmark.id !== response.data?.id)]);
      setBookmarkMessage('Bookmark saved.');
    } else {
      setError(response.error ?? 'Failed to save bookmark');
    }

    setIsBookmarkSaving(false);
  };

  const loadPlaylists = useCallback(async () => {
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
  }, []);

  const handlePlaylistDialogChange = async (open: boolean) => {
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
    setPlaylistMessage(null);
    setError(null);

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
      setPlaylistMessage(`Added to ${targetPlaylist?.name ?? 'playlist'}.`);
      setIsPlaylistDialogOpen(false);
    } else {
      setError(response.error ?? 'Failed to add video to playlist');
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
    } else {
      setError(response.error ?? 'Failed to update reaction');
    }

    setIsReactionSaving(false);
  };

  const isLiked = reactionSummary?.currentUserReaction === 'Like';
  const isDisliked = reactionSummary?.currentUserReaction === 'Dislike';
  const canManageVideo = user?.role === 'admin' || user?.role === 'editor';

  if (isLoading) {
    return (
      <DashboardLayout title="Watch Video">
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
      <DashboardLayout title="Watch Video">
        <Card className="border-destructive/40 bg-destructive/5 py-16 text-center">
          <CardContent className="space-y-4">
            <p className="font-medium text-destructive">{error ?? 'Video not found'}</p>
            <Button variant="outline" onClick={() => router.push('/videos')}>
              Back to Library
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const isVideoReady = video.status === 'Ready' || !video.status;
  const isVideoFailed = video.status === 'Failed';
  const processingProgress = processingStatus?.progress ?? 0;

  return (
    <DashboardLayout title="Watch Video">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-6">
            {isVideoReady ? (
              <VideoPlayer
                videoId={video.id}
                hlsUrl={video.hlsUrl}
                title={video.title}
                duration={video.duration}
                bookmarks={bookmarks}
                onBookmarkAdd={handleBookmarkAdd}
                isBookmarkSaving={isBookmarkSaving}
              />
            ) : (
              <Card className={isVideoFailed ? 'border-destructive/30 bg-destructive/5' : 'border-primary/30 bg-primary/5'}>
                <CardContent className="flex aspect-video flex-col items-center justify-center gap-3 text-center">
                  <Clock className={isVideoFailed ? 'h-10 w-10 text-destructive' : 'h-10 w-10 text-primary'} />
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      {isVideoFailed ? 'Video processing failed' : 'Video is still being processed'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {isVideoFailed
                        ? 'Playback is unavailable because this video could not be processed.'
                        : 'Playback will be available once processing finishes.'}
                    </p>
                  </div>
                  {isVideoFailed ? (
                    <p className="max-w-md text-sm text-destructive">
                      {processingStatus?.errorMessage || 'No processing error details are available.'}
                    </p>
                  ) : (
                    <div className="w-full max-w-md space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{processingStatus?.jobType || 'Video processing'}</span>
                        <span>
                          {processingStatus?.progress !== null && processingStatus?.progress !== undefined
                            ? `${processingStatus.progress}%`
                            : 'Pending'}
                        </span>
                      </div>
                      <Progress value={processingProgress} className="h-3" />
                    </div>
                  )}
                </CardContent>
              </Card>
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
                        disabled={isReactionSaving}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors text-xs font-medium text-foreground disabled:opacity-50 cursor-pointer ${
                          isLiked ? 'bg-accent font-semibold' : 'bg-transparent'
                        }`}
                      >
                        <ThumbsUp className={`size-3.5 ${isLiked ? 'fill-current' : ''}`} />
                        <span className="font-mono">{reactionSummary?.likeCount ?? 0}</span>
                      </button>
                      <button
                        onClick={() => void handleReaction('Dislike')}
                        disabled={isReactionSaving}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors text-xs font-medium text-foreground disabled:opacity-50 cursor-pointer ${
                          isDisliked ? 'bg-accent font-semibold' : 'bg-transparent'
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
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors text-xs font-medium text-foreground bg-transparent cursor-pointer">
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
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors text-xs font-medium text-foreground bg-transparent cursor-pointer">
                    <Share2 className="size-3.5" />
                    Share
                  </button>
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

            {bookmarkMessage && (
              <Card className="border-chart-5/30 bg-chart-5/10">
                <CardContent className="py-3 text-sm text-foreground">{bookmarkMessage}</CardContent>
              </Card>
            )}

            {playlistMessage && (
              <Card className="border-chart-5/30 bg-chart-5/10">
                <CardContent className="py-3 text-sm text-foreground">{playlistMessage}</CardContent>
              </Card>
            )}

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

            {processingStatus && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle>Processing Status</CardTitle>
                  <CardDescription>{processingStatus.jobStatus || processingStatus.videoStatus}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {processingStatus.progress !== null && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{processingStatus.jobType || 'Video processing'}</span>
                        <span className="font-mono">{processingStatus.progress}%</span>
                      </div>
                      <Progress value={processingStatus.progress} className="h-3" />
                    </div>
                  )}
                  {processingStatus.errorMessage && (
                    <p className="text-sm text-destructive">{processingStatus.errorMessage}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {video.allowComments !== false && (
              <CommentsSection
                videoId={video.id}
                currentUserId={user?.id}
                showCard={false}
                showDescription={false}
              />
            )}
          </div>

          <aside className="space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-3 text-muted-foreground">Related Videos</h3>
              <div className="space-y-4">
                {relatedVideos.map((relatedVideo) => (
                  <button
                    key={relatedVideo.id}
                    onClick={() => router.push(`/videos/${relatedVideo.id}`)}
                    className="flex gap-3 text-left w-full group cursor-pointer"
                  >
                    <div className="relative w-32 aspect-video shrink-0 rounded ring-1 ring-border overflow-hidden bg-black">
                      <img
                        src={relatedVideo.thumbnail || '/placeholder.png'}
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
                  </button>
                ))}
                {relatedVideos.length === 0 && (
                  <p className="text-xs text-muted-foreground">No related videos found.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </DashboardLayout>
    );
}
