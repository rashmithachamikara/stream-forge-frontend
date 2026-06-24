'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Upload,
  Edit2,
  Trash2,
  Code,
  Copy,
  Check,
  Loader,
} from 'lucide-react';
import { apiClient } from '@/shared/lib/api';
import { Video, VideoListFilters, VideoStatus, VideoVisibility } from '@/features/videos/types';
import { VideoCard } from '@/features/videos/components/VideoCard';

export default function EditorDashboard() {
  // State for videos and loading
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtering and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VideoStatus | 'all'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<VideoListFilters['visibility'] | 'all'>('all');
  const [sortBy, setSortBy] = useState('recentlyCreated');
  const [currentPage, setCurrentPage] = useState(1);

  // Pagination info
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Stats info
  const [stats, setStats] = useState({
    myVideos: 0,
    totalViews: 0,
    watchTime: 0,
    processingCount: 0,
  });

  // Dialog states
  const [embedDialogOpen, setEmbedDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // Selected video and form state
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Embed configuration
  const [embedWidth, setEmbedWidth] = useState('560');
  const [embedHeight, setEmbedHeight] = useState('315');
  const [autoplay, setAutoplay] = useState(false);
  const [controls, setControls] = useState(true);
  const [loop, setLoop] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    visibility: 'public' as VideoVisibility,
    allowComments: true,
    allowLikes: true,
    allowBookmarks: true,
  });

  const pageSize = 12;

  const loadVideos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const filters: VideoListFilters = {
      search: searchTerm || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      visibility: visibilityFilter === 'all' ? undefined : visibilityFilter,
      sort: sortBy,
      page: currentPage,
      pageSize,
    };

    const response = await apiClient.getOwnedVideos(filters);

    if (response.success && response.data) {
      setVideos(response.data.items);
      setTotalPages(response.data.totalPages);
      setTotalCount(response.data.totalCount);
    } else {
      setError(response.error || 'Failed to load videos');
      setVideos([]);
    }

    setIsLoading(false);
  }, [searchTerm, statusFilter, visibilityFilter, sortBy, currentPage]);

  const loadStats = useCallback(async () => {
    try {
      const [ownedVideosRes, analyticsRes, processingVideosRes, uploadingVideosRes] = await Promise.all([
        apiClient.getOwnedVideos({ page: 1, pageSize: 1 }),
        apiClient.getMeAnalyticsSummary(),
        apiClient.getOwnedVideos({ status: 'Processing', page: 1, pageSize: 1 }),
        apiClient.getOwnedVideos({ status: 'Uploading', page: 1, pageSize: 1 }),
      ]);

      let myVideos = 0;
      let totalViews = 0;
      let watchTime = 0;
      let processingCount = 0;

      if (ownedVideosRes.success && ownedVideosRes.data) {
        myVideos = ownedVideosRes.data.totalCount;
      }
      if (analyticsRes.success && analyticsRes.data) {
        totalViews = analyticsRes.data.totalViews;
        watchTime = analyticsRes.data.totalWatchTime;
      }
      if (processingVideosRes.success && processingVideosRes.data) {
        processingCount += processingVideosRes.data.totalCount;
      }
      if (uploadingVideosRes.success && uploadingVideosRes.data) {
        processingCount += uploadingVideosRes.data.totalCount;
      }

      setStats({
        myVideos,
        totalViews,
        watchTime,
        processingCount,
      });
    } catch (err) {
      console.error('Failed to load editor stats:', err);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      await Promise.all([loadVideos(), loadStats()]);
    };
    void run();
  }, [loadVideos, loadStats]);

  const handleEmbed = (video: Video) => {
    setSelectedVideo(video);
    setEmbedDialogOpen(true);
    setCopied(false);
  };

  const handleEditClick = (video: Video) => {
    setSelectedVideo(video);
    setEditForm({
      title: video.title,
      description: video.description,
      visibility: video.visibility,
      allowComments: video.allowComments ?? true,
      allowLikes: video.allowLikes ?? true,
      allowBookmarks: video.allowBookmarks ?? true,
    });
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (video: Video) => {
    setSelectedVideo(video);
    setDeleteDialogOpen(true);
  };

  const handleSaveMetadata = async () => {
    if (!selectedVideo) return;

    setIsSubmitting(true);
    const response = await apiClient.updateVideoMetadata(selectedVideo.id, {
      title: editForm.title,
      description: editForm.description,
      visibility: editForm.visibility,
      allowComments: editForm.allowComments,
      allowLikes: editForm.allowLikes,
      allowBookmarks: editForm.allowBookmarks,
    });

    if (response.success) {
      // Update local state
      setVideos(
        videos.map((v) =>
          v.id === selectedVideo.id
            ? {
                ...v,
                title: editForm.title,
                description: editForm.description,
                visibility: editForm.visibility as Video['visibility'],
                allowComments: editForm.allowComments,
                allowLikes: editForm.allowLikes,
                allowBookmarks: editForm.allowBookmarks,
              }
            : v
        )
      );
      setEditDialogOpen(false);
      void loadStats();
    } else {
      setError(response.error || 'Failed to update video');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!selectedVideo) return;

    setIsSubmitting(true);
    const response = await apiClient.deleteVideo(selectedVideo.id);

    if (response.success) {
      setVideos(videos.filter((v) => v.id !== selectedVideo.id));
      setTotalCount(Math.max(0, totalCount - 1));
      setDeleteDialogOpen(false);
      void loadStats();
    } else {
      setError(response.error || 'Failed to delete video');
    }
    setIsSubmitting(false);
  };

  const getEmbedCode = (video: Video) => {
    const params = [];
    if (autoplay) params.push('autoplay=1');
    if (!controls) params.push('controls=0');
    if (loop) params.push('loop=1');
    const queryString = params.length > 0 ? `?${params.join('&')}` : '';

    return `<iframe 
  width="${embedWidth}" 
  height="${embedHeight}" 
  src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed/${video.id}${queryString}" 
  frameborder="0" 
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
  allowfullscreen>
  </iframe>`;
  };

  const copyToClipboard = () => {
    if (selectedVideo) {
      navigator.clipboard.writeText(getEmbedCode(selectedVideo));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatWatchTime = (seconds: number) => {
    const hours = seconds / 3600;
    if (hours >= 1) return `${hours.toFixed(1)}h`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  return (
    <DashboardLayout title="Editor Dashboard" requiredRoles={['admin', 'editor']}>
      <div className="space-y-8">
        {/* Header Section */}
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
            Editor dashboard
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        </div>

        {/* Flat KPI Cards Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              My Videos
            </div>
            <div className="text-2xl font-bold font-mono mt-1">
              {stats.myVideos}
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Total Views
            </div>
            <div className="text-2xl font-bold font-mono mt-1">
              {stats.totalViews.toLocaleString()}
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Watch Time
            </div>
            <div className="text-2xl font-bold font-mono mt-1">
              {formatWatchTime(stats.watchTime)}
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Processing
            </div>
            <div className="text-2xl font-bold font-mono mt-1">
              {stats.processingCount}
            </div>
          </div>
        </div>

        {/* Videos Feed List (Flat Design) */}
        <div className="space-y-6">
          <div className="flex flex-row items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-base font-semibold uppercase tracking-wider text-muted-foreground">
                Your Videos
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage and organize your uploaded videos
              </p>
            </div>
            <Button
              className="gap-2 bg-foreground text-background hover:opacity-90 py-1.5 px-3 text-xs font-semibold rounded-md"
              onClick={() => (window.location.href = '/videos/upload')}
            >
              <Upload className="size-3.5" />
              Upload Video
            </Button>
          </div>

          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
              <Input
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-64"
              />

              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as VideoStatus | 'all');
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Uploading">Uploading</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Ready">Ready</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={visibilityFilter}
                onValueChange={(v) => {
                  setVisibilityFilter(v as VideoListFilters['visibility'] | 'all');
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Filter by visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Visibility</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sortBy}
                onValueChange={(v) => {
                  setSortBy(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recentlyCreated">Recently Created</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="title">Alphabetically</SelectItem>
                  <SelectItem value="views">Most Viewed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading && (
              <div className="text-center py-12">
                <Loader className="size-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-sm text-muted-foreground">Loading your videos...</p>
              </div>
            )}

            {!isLoading && videos.length === 0 && (
              <div className="text-center py-16 flex flex-col items-center justify-center border border-dashed border-border rounded-lg bg-card">
                <p className="text-sm text-muted-foreground mb-4">No videos found matching your filters</p>
                <Button
                  className="gap-2 bg-foreground text-background hover:opacity-90 text-xs font-semibold py-1.5 px-3"
                  onClick={() => (window.location.href = '/videos/upload')}
                >
                  <Plus className="size-3.5" />
                  Upload Your First Video
                </Button>
              </div>
            )}

            {!isLoading && videos.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
                  {videos.map((video) => (
                    <div key={video.id} className="space-y-3">
                      <VideoCard video={video} href={`/videos/${video.id}`} />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs py-1 px-2 border-border bg-card text-foreground hover:bg-accent"
                          onClick={() => handleEditClick(video)}
                        >
                          <Edit2 className="size-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs py-1 px-2 border-border bg-card text-foreground hover:bg-accent"
                          onClick={() => handleEmbed(video)}
                        >
                          <Code className="size-3 mr-1" />
                          Embed
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 border-border bg-card size-8 p-0"
                          onClick={() => handleDeleteClick(video)}
                          aria-label="Delete video"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      className="text-xs py-1 px-3"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    >
                      Previous
                    </Button>
                    <span className="text-xs text-muted-foreground font-mono">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      className="text-xs py-1 px-3"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Embed Dialog */}
      <Dialog open={embedDialogOpen} onOpenChange={setEmbedDialogOpen}>
        <DialogContent className="bg-background border border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle>Embed Video</DialogTitle>
            <DialogDescription>
              Configure and copy the embed code for your website
            </DialogDescription>
          </DialogHeader>
          {selectedVideo && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Video Title</label>
                <p className="text-sm text-foreground">{selectedVideo.title}</p>
              </div>

              <Tabs defaultValue="code" className="w-full">
                <TabsList className="grid w-full grid-cols-2 !border-0 !bg-muted !p-[3px]">
                  <TabsTrigger value="code" className="text-xs">Code</TabsTrigger>
                  <TabsTrigger value="configure" className="text-xs">Configure</TabsTrigger>
                </TabsList>

                <TabsContent value="code" className="space-y-4 pt-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Embed Code</label>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-64 whitespace-pre-wrap break-all font-mono border border-border">
                        <code>{getEmbedCode(selectedVideo)}</code>
                      </pre>
                    </div>
                  </div>
                  <Button
                    onClick={copyToClipboard}
                    className="w-full gap-2 bg-foreground text-background hover:opacity-90 text-xs font-semibold py-1.5 rounded-md"
                    variant={copied ? 'secondary' : 'default'}
                  >
                    {copied ? (
                      <>
                        <Check className="size-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="size-4" />
                        Copy to Clipboard
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="configure" className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="width" className="text-xs font-medium text-muted-foreground">Width (px)</Label>
                        <Input
                          id="width"
                          type="number"
                          value={embedWidth}
                          onChange={(e) => setEmbedWidth(e.target.value)}
                          placeholder="560"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="height" className="text-xs font-medium text-muted-foreground">Height (px)</Label>
                        <Input
                          id="height"
                          type="number"
                          value={embedHeight}
                          onChange={(e) => setEmbedHeight(e.target.value)}
                          placeholder="315"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="autoplay" className="text-sm">Autoplay</Label>
                          <p className="text-xs text-muted-foreground">Start playing automatically</p>
                        </div>
                        <Switch id="autoplay" checked={autoplay} onCheckedChange={setAutoplay} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="controls" className="text-sm">Show Controls</Label>
                          <p className="text-xs text-muted-foreground">Display video controls</p>
                        </div>
                        <Switch id="controls" checked={controls} onCheckedChange={setControls} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="loop" className="text-sm">Loop</Label>
                          <p className="text-xs text-muted-foreground">Replay video continuously</p>
                        </div>
                        <Switch id="loop" checked={loop} onCheckedChange={setLoop} />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Video Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-background border border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Video Metadata</DialogTitle>
            <DialogDescription>
              Update your video information and settings
            </DialogDescription>
          </DialogHeader>
          {selectedVideo && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-medium text-muted-foreground">Title</Label>
                <Input
                  id="title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Enter video title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-medium text-muted-foreground">Description</Label>
                <textarea
                  id="description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Enter video description"
                  className="min-h-24 w-full bg-muted border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="visibility" className="text-xs font-medium text-muted-foreground">Visibility</Label>
                <Select
                  value={editForm.visibility}
                  onValueChange={(v) => setEditForm({ ...editForm, visibility: v as VideoVisibility })}
                >
                  <SelectTrigger id="visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Video Settings</Label>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="allow-comments" className="text-sm">Allow Comments</Label>
                    <p className="text-xs text-muted-foreground font-light">
                      Let viewers comment on this video
                    </p>
                  </div>
                  <Switch
                    id="allow-comments"
                    checked={editForm.allowComments}
                    onCheckedChange={(v) => setEditForm({ ...editForm, allowComments: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="allow-likes" className="text-sm">Allow Likes</Label>
                    <p className="text-xs text-muted-foreground font-light">
                      Let viewers like this video
                    </p>
                  </div>
                  <Switch
                    id="allow-likes"
                    checked={editForm.allowLikes}
                    onCheckedChange={(v) => setEditForm({ ...editForm, allowLikes: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="allow-bookmarks" className="text-sm">Allow Bookmarks</Label>
                    <p className="text-xs text-muted-foreground font-light">
                      Let viewers bookmark timestamps
                    </p>
                  </div>
                  <Switch
                    id="allow-bookmarks"
                    checked={editForm.allowBookmarks}
                    onCheckedChange={(v) => setEditForm({ ...editForm, allowBookmarks: v })}
                  />
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  disabled={isSubmitting}
                  className="text-xs border-border bg-card"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveMetadata}
                  disabled={isSubmitting}
                  className="gap-2 bg-foreground text-background hover:opacity-90 text-xs font-semibold"
                >
                  {isSubmitting && <Loader className="size-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-background border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;<strong>{selectedVideo?.title}</strong>&quot;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting} className="text-xs border-border bg-card">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90 text-xs text-destructive-foreground font-semibold"
            >
              {isSubmitting && <Loader className="size-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </DashboardLayout>
  );
}
