'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  Plus,
  Upload,
  Play,
  Eye,
  Edit2,
  Trash2,
  Archive,
  Code,
  Copy,
  Check,
  CheckCircle,
  AlertCircle,
  Loader,
  Globe,
  Lock,
  Users,
} from 'lucide-react';
import { apiClient } from '@/shared/lib/api';
import { Video, VideoListFilters, VideoStatus, VideoVisibility } from '@/features/videos/types';
import { formatDuration } from '@/features/videos/utils';
import { capitalize } from '@/shared/lib/utils';

export default function EditorDashboard() {
  // State for videos and loading
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtering and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VideoStatus | 'all'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<VideoListFilters['visibility'] | 'all'>('all');
  const [sortBy, setSortBy] = useState('recentlyUpdated');
  const [currentPage, setCurrentPage] = useState(1);

  // Pagination info
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Dialog states
  const [embedDialogOpen, setEmbedDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

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

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

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

  const handleArchiveClick = (video: Video) => {
    setSelectedVideo(video);
    setArchiveDialogOpen(true);
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
    } else {
      setError(response.error || 'Failed to delete video');
    }
    setIsSubmitting(false);
  };

  const handleArchive = async () => {
    if (!selectedVideo) return;

    setIsSubmitting(true);
    const response = await apiClient.archiveVideo(selectedVideo.id);

    if (response.success) {
      // Reload videos or remove from list
      await loadVideos();
      setArchiveDialogOpen(false);
    } else {
      setError(response.error || 'Failed to archive video');
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

  const stats = [
    { label: 'Total Videos', value: totalCount },
    { label: 'Total Views', value: videos.reduce((sum, v) => sum + v.views, 0) },
    { label: 'Total Duration', value: formatDuration(videos.reduce((sum, v) => sum + v.duration, 0)) },
  ];

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'Ready':
        return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'Failed':
        return <AlertCircle className="w-3 h-3 text-red-600" />;
      case 'Processing':
      case 'Uploading':
        return <Loader className="w-3 h-3 text-blue-600 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Ready':
        return 'bg-green-100 text-green-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      case 'Processing':
      case 'Uploading':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout title="Editor Dashboard" requiredRoles={['editor']}>
      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Videos List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Your Videos</CardTitle>
              <CardDescription>Manage and organize your uploaded videos</CardDescription>
            </div>
            <Button
              className="gap-2 gradient-primary text-white font-medium"
              onClick={() => (window.location.href = '/videos/upload')}
            >
              <Upload className="w-4 h-4" />
              Upload Video
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input
                  placeholder="Search videos..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />

                <Select value={statusFilter} onValueChange={(v) => {
                  setStatusFilter(v);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger>
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

                <Select value={visibilityFilter} onValueChange={(v) => {
                  setVisibilityFilter(v);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Visibility</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(v) => {
                  setSortBy(v);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recentlyUpdated">Recently Updated</SelectItem>
                    <SelectItem value="recentlyCreated">Recently Created</SelectItem>
                    <SelectItem value="alphabetical">Alphabetically</SelectItem>
                    <SelectItem value="viewCount">Most Viewed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {isLoading && (
                <div className="text-center py-12">
                  <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Loading your videos...</p>
                </div>
              )}

              {!isLoading && videos.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No videos found</p>
                  <Button
                    className="gap-2 gradient-primary text-white font-medium"
                    onClick={() => (window.location.href = '/videos/upload')}
                  >
                    <Plus className="w-4 h-4" />
                    Upload Your First Video
                  </Button>
                </div>
              )}

              {!isLoading && videos.length > 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {videos.map((video) => (
                      <Card
                        key={video.id}
                        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                      >
                        <div className="relative aspect-video bg-muted">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-90 transition-opacity drop-shadow-lg" />
                          </div>
                          <Badge className="absolute top-2 right-2 bg-black/80 text-white">
                            {formatDuration(video.duration)}
                          </Badge>

                          {/* Status and Visibility badges */}
                          <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                            {/* Visibility */}
                            <Badge
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {video.visibility === 'public' ? (
                                <Globe className="w-3 h-3" />
                              ) : video.visibility === 'private' ? (
                                <Lock className="w-3 h-3" />
                              ) : (
                                <Users className="w-3 h-3" />
                              )}
                            </Badge>

                            {/* Status */}
                            {video.status && (
                              <Badge
                                className={`flex items-center gap-1 ${getStatusColor(
                                  video.status
                                )}`}
                              >
                                {getStatusIcon(video.status)}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold line-clamp-2 mb-2">{video.title}</h3>
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                            {video.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {video.views} views
                            </span>
                            <span>{video.uploadedAt.toLocaleDateString()}</span>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleEditClick(video)}
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleEmbed(video)}
                            >
                              <Code className="w-3 h-3" />
                              Embed
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteClick(video)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <Button
                        variant="outline"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
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
          </CardContent>
        </Card>
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
                <label className="text-sm font-medium mb-2 block">Video Title</label>
                <p className="text-sm text-muted-foreground">{selectedVideo.title}</p>
              </div>

              <Tabs defaultValue="code" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="code">Code</TabsTrigger>
                  <TabsTrigger value="configure">Configure</TabsTrigger>
                </TabsList>

                <TabsContent value="code" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Embed Code</label>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-64 whitespace-pre-wrap break-all">
                        <code>{getEmbedCode(selectedVideo)}</code>
                      </pre>
                    </div>
                  </div>
                  <Button
                    onClick={copyToClipboard}
                    className="w-full gap-2"
                    variant={copied ? 'secondary' : 'default'}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy to Clipboard
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="configure" className="space-y-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="width">Width (px)</Label>
                        <Input
                          id="width"
                          type="number"
                          value={embedWidth}
                          onChange={(e) => setEmbedWidth(e.target.value)}
                          placeholder="560"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="height">Height (px)</Label>
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
                          <Label htmlFor="autoplay">Autoplay</Label>
                          <p className="text-xs text-muted-foreground">Start playing automatically</p>
                        </div>
                        <Switch id="autoplay" checked={autoplay} onCheckedChange={setAutoplay} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="controls">Show Controls</Label>
                          <p className="text-xs text-muted-foreground">Display video controls</p>
                        </div>
                        <Switch id="controls" checked={controls} onCheckedChange={setControls} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="loop">Loop</Label>
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
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Enter video title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Enter video description"
                  className="w-full min-h-24 px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  value={editForm.visibility}
                  onValueChange={(v) => setEditForm({ ...editForm, visibility: v })}
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

              <div className="space-y-3">
                <Label>Video Settings</Label>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="allow-comments">Allow Comments</Label>
                    <p className="text-xs text-muted-foreground">
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
                    <Label htmlFor="allow-likes">Allow Likes</Label>
                    <p className="text-xs text-muted-foreground">
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
                    <Label htmlFor="allow-bookmarks">Allow Bookmarks</Label>
                    <p className="text-xs text-muted-foreground">
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

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveMetadata}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting && <Loader className="w-4 h-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "<strong>{selectedVideo?.title}</strong>"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting && <Loader className="w-4 h-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Video?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive "<strong>{selectedVideo?.title}</strong>"? Archived
              videos can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isSubmitting && <Loader className="w-4 h-4 animate-spin mr-2" />}
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
