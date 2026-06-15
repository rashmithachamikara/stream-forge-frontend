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
  Bookmark,
  ListPlus,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Calendar,
  Play,
  Shield,
  Clock,
  Globe,
  Lock,
  Users,
  CheckCircle,
  AlertCircle,
  Loader,
} from 'lucide-react';
import { Bookmark as BookmarkType } from '@/features/bookmarks/types';
import { ReactionSummary, ReactionType, Video, VideoProcessingStatus } from '@/features/videos/types';
import { useAuth } from '@/features/auth/AuthContext';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import { Playlist } from '@/features/playlists/types';

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

const getBookmarkTitle = (bookmark: BookmarkType) => bookmark.note || `Bookmark at ${formatTime(bookmark.timestampSeconds)}`;

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

  const canManageVideo = user?.role === 'admin' || user?.role === 'editor';

  if (isLoading) {
    return (
      <DashboardLayout title="Watch Video">
        <div className="mx-auto max-w-6xl">
          <Card className="overflow-hidden py-0">
            <CardContent className="flex aspect-video items-center justify-center p-0 text-center">
              <p className="text-muted-foreground">Loading video...</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !video) {
    return (
      <DashboardLayout title="Watch Video">
        <div className="mx-auto max-w-6xl">
          <Card className="border-destructive/40 bg-destructive/5 py-16 text-center">
            <CardContent className="space-y-4">
              <p className="font-medium text-destructive">{error ?? 'Video not found'}</p>
              <Button variant="outline" onClick={() => router.push('/videos')}>
                Back to Library
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const isVideoReady = video.status === 'Ready' || !video.status;
  const isVideoFailed = video.status === 'Failed';
  const processingProgress = processingStatus?.progress ?? 0;
  const isLiked = reactionSummary?.currentUserReaction === 'Like';
  const isDisliked = reactionSummary?.currentUserReaction === 'Dislike';

  return (
    <DashboardLayout title="Watch Video">
      <div className="mx-auto max-w-6xl space-y-8">
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
                  <Progress value={processingProgress} className="h-3 border border-border bg-muted" />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          <div>
            <h1 className="mb-4 text-3xl font-bold text-foreground">{video.title}</h1>

            <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border py-4">
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {video.views} views
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {video.uploadedAt.toLocaleDateString()}
                </span>
                {video.updatedAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Updated {video.updatedAt.toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {video.allowLikes !== false && (
                  <>
                    <Button
                      variant={isLiked ? 'default' : 'outline'}
                      className={isLiked ? 'gap-2 bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary)/0.82)] hover:text-white active:bg-[hsl(var(--primary)/0.82)] active:text-white' : 'gap-2'}
                      onClick={() => void handleReaction('Like')}
                      disabled={isReactionSaving}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Like {reactionSummary ? `(${reactionSummary.likeCount})` : ''}
                    </Button>
                    <Button
                      variant={isDisliked ? 'default' : 'outline'}
                      className={isDisliked ? 'gap-2 bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary)/0.82)] hover:text-white active:bg-[hsl(var(--primary)/0.82)] active:text-white' : 'gap-2'}
                      onClick={() => void handleReaction('Dislike')}
                      disabled={isReactionSaving}
                    >
                      <ThumbsDown className="h-4 w-4" />
                      Dislike {reactionSummary ? `(${reactionSummary.dislikeCount})` : ''}
                    </Button>
                  </>
                )}
                {video.allowBookmarks !== false && (
                  <Dialog open={isPlaylistDialogOpen} onOpenChange={(open) => void handlePlaylistDialogChange(open)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2 bg-transparent">
                        <ListPlus className="h-4 w-4" />
                        Save
                      </Button>
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
                              className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition hover:bg-muted"
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
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
                {canManageVideo && (
                  <Button
                    variant="outline"
                    className="gap-2 bg-transparent"
                    onClick={() => router.push(`/videos/${video.id}/manage`)}
                  >
                    <Shield className="h-4 w-4" />
                    Manage
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-lg bg-muted p-4">
              <InitialsAvatar name={video.uploadedBy} />
              <div className="flex-1">
                <p className="font-medium text-foreground">{video.uploadedBy}</p>
                <p className="text-xs text-muted-foreground">
                  Video uploaded on {video.uploadedAt.toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="mb-2 font-semibold text-foreground">About this video</h2>
              <p className="text-muted-foreground">{video.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline" className="flex items-center gap-1.5">
                  {video.visibility === 'public' ? (
                    <Globe className="h-3 w-3" />
                  ) : video.visibility === 'private' ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    <Users className="h-3 w-3" />
                  )}
                  {capitalize(video.visibility)}
                </Badge>

                {video.status && (
                  <Badge
                    className={`flex items-center gap-1.5 ${
                      video.status === 'Ready'
                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                        : video.status === 'Processing' || video.status === 'Uploading'
                          ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                          : 'bg-red-100 text-red-800 hover:bg-red-100'
                    }`}
                  >
                    {video.status === 'Ready' ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : video.status === 'Failed' ? (
                      <AlertCircle className="h-3 w-3" />
                    ) : (
                      <Loader className="h-3 w-3 animate-spin" />
                    )}
                    {capitalize(video.status)}
                  </Badge>
                )}

                {video.categories.map((category) => (
                  <Badge key={category} variant="secondary">
                    {capitalize(category)}
                  </Badge>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {video.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    #{capitalize(tag)}
                  </Badge>
                ))}
              </div>
            </div>
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

          {bookmarks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Bookmarks</CardTitle>
                <CardDescription>Saved timestamps for this video.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {bookmarks.map((bookmark) => (
                  <div key={bookmark.id} className="flex items-center justify-between rounded-lg border bg-muted/40 p-3">
                    <div>
                      <p className="font-medium text-foreground">{getBookmarkTitle(bookmark)}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(bookmark.timestampSeconds)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {processingStatus && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Processing Status</CardTitle>
                <CardDescription>{processingStatus.jobStatus || processingStatus.videoStatus}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {processingStatus.progress !== null && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{processingStatus.jobType || 'Video processing'}</span>
                      <span>{processingStatus.progress}%</span>
                    </div>
                    <Progress value={processingStatus.progress} className="h-3 border border-border bg-muted" />
                  </div>
                )}
                {processingStatus.errorMessage && (
                  <p className="text-sm text-destructive">{processingStatus.errorMessage}</p>
                )}
              </CardContent>
            </Card>
          )}

          {video.allowComments !== false && (
            <CommentsSection videoId={video.id} currentUserId={user?.id} />
          )}

          <div>
            <h2 className="mb-4 text-2xl font-bold text-foreground">Related Videos</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {relatedVideos.map((relatedVideo) => (
                <Card
                  key={relatedVideo.id}
                  className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-lg"
                  onClick={() => router.push(`/videos/${relatedVideo.id}`)}
                >
                  <div className="relative aspect-video bg-gradient-to-br from-primary/10 to-primary/5">
                    <img src={relatedVideo.thumbnail} alt={relatedVideo.title} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                      <Play className="h-10 w-10 text-white opacity-0 drop-shadow-lg transition-opacity group-hover:opacity-90" />
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="mb-2 line-clamp-2 font-semibold">{relatedVideo.title}</h3>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{relatedVideo.description}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{relatedVideo.views} views</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
