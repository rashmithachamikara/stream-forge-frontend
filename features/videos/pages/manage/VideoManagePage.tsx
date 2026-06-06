'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { apiClient } from '@/shared/lib/api';
import { capitalize } from '@/shared/lib/utils';
import { Video, VideoProcessingStatus } from '@/features/videos/types';
import { VideoAccessGrantsCard } from '@/features/videos/components/VideoAccessGrantsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  Save,
  Trash2,
  Archive,
  Loader2,
  Shield,
  Eye,
  Clock,
  Calendar,
  Globe,
  Lock,
  Users,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

const EDITABLE_VISIBILITY_OPTIONS = ['public', 'private', 'internal', 'restricted'] as const;

type ManageFormState = {
  title: string;
  description: string;
  visibility: Video['visibility'];
  allowComments: boolean;
  allowLikes: boolean;
  allowBookmarks: boolean;
};

const getManageFormState = (video: Video): ManageFormState => ({
  title: video.title,
  description: video.description,
  visibility: video.visibility,
  allowComments: video.allowComments ?? true,
  allowLikes: video.allowLikes ?? true,
  allowBookmarks: video.allowBookmarks ?? true,
});

export default function VideoManagePage({ videoId }: { videoId: string }) {
  const router = useRouter();
  const [video, setVideo] = useState<Video | null>(null);
  const [processingStatus, setProcessingStatus] = useState<VideoProcessingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [form, setForm] = useState<ManageFormState>({
    title: '',
    description: '',
    visibility: 'public',
    allowComments: true,
    allowLikes: true,
    allowBookmarks: true,
  });

  useEffect(() => {
    let isMounted = true;

    const loadVideo = async () => {
      setIsLoading(true);
      setError(null);

      const [videoResponse, processingResponse] = await Promise.all([
        apiClient.getVideoById(videoId),
        apiClient.getVideoProcessingStatus(videoId),
      ]);

      if (!isMounted) {
        return;
      }

      if (videoResponse.success && videoResponse.data) {
        const loadedVideo = videoResponse.data;
        setVideo(loadedVideo);
        setForm(getManageFormState(loadedVideo));
      } else {
        setVideo(null);
        setError(videoResponse.error ?? 'Failed to load video');
      }

      if (processingResponse.success && processingResponse.data) {
        setProcessingStatus(processingResponse.data);
      }

      setIsLoading(false);
    };

    loadVideo();

    return () => {
      isMounted = false;
    };
  }, [videoId]);

  const visibilityLabel = useMemo(() => capitalize(form.visibility), [form.visibility]);
  const savedForm = useMemo(() => (video ? getManageFormState(video) : null), [video]);
  const hasChanges = Boolean(
    savedForm &&
      (form.title !== savedForm.title ||
        form.description !== savedForm.description ||
        form.visibility !== savedForm.visibility ||
        form.allowComments !== savedForm.allowComments ||
        form.allowLikes !== savedForm.allowLikes ||
        form.allowBookmarks !== savedForm.allowBookmarks)
  );

  const getVisibilityIcon = (value: Video['visibility']) => {
    if (value === 'public') return <Globe className="h-4 w-4" />;
    if (value === 'private') return <Lock className="h-4 w-4" />;
    return <Users className="h-4 w-4" />;
  };

  const saveChanges = async () => {
    if (!video || !hasChanges) return;

    setIsSaving(true);
    setError(null);

    const response = await apiClient.updateVideoMetadata(video.id, {
      title: form.title,
      description: form.description,
      visibility: form.visibility,
      allowComments: form.allowComments,
      allowLikes: form.allowLikes,
      allowBookmarks: form.allowBookmarks,
    });

    if (response.success && response.data) {
      setVideo(response.data);
      setForm(getManageFormState(response.data));
    } else {
      setError(response.error ?? 'Failed to save changes');
    }

    setIsSaving(false);
  };

  const discardChanges = () => {
    if (!savedForm) return;

    setForm(savedForm);
    setError(null);
  };

  const deleteVideo = async () => {
    if (!video) return;

    setIsDeleting(true);
    setError(null);

    const response = await apiClient.deleteVideo(video.id);

    if (response.success) {
      router.push('/videos');
    } else {
      setError(response.error ?? 'Failed to delete video');
      setIsDeleting(false);
    }
  };

  const archiveVideo = async () => {
    if (!video) return;

    setIsArchiving(true);
    setError(null);

    const response = await apiClient.archiveVideo(video.id);

    if (response.success) {
      const refreshed = await apiClient.getVideoById(video.id);
      if (refreshed.success && refreshed.data) {
        setVideo(refreshed.data);
      }
      setArchiveOpen(false);
    } else {
      setError(response.error ?? 'Failed to archive video');
    }

    setIsArchiving(false);
  };

  const processingProgress = processingStatus?.progress ?? 0;
  const isProcessing = video?.status === 'Uploading' || video?.status === 'Processing';

  if (isLoading) {
    return (
      <DashboardLayout title="Manage Video" requiredRoles={['admin', 'editor']}>
        <div className="mx-auto max-w-6xl">
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading video details...
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !video) {
    return (
      <DashboardLayout title="Manage Video" requiredRoles={['admin', 'editor']}>
        <div className="mx-auto max-w-6xl">
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="space-y-4 py-10 text-center">
              <p className="font-medium text-destructive">{error ?? 'Video not found'}</p>
              <Button variant="outline" onClick={() => router.push(`/videos/${videoId}`)}>
                Back to Video
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Manage Video" requiredRoles={['admin', 'editor']}>
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Button variant="ghost" className="gap-2 px-0" onClick={() => router.push(`/videos/${video.id}`)}>
              <ArrowLeft className="h-4 w-4" />
              Back to video
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Manage Video</h1>
            <p className="text-muted-foreground">Edit details and review operational status for this video.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 bg-transparent" onClick={() => setArchiveOpen(true)}>
              <Archive className="h-4 w-4" />
              Archive
            </Button>
            <Button variant="destructive" className="gap-2" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Edit Video</CardTitle>
              <CardDescription>Update metadata, permissions, and playback settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                    className="min-h-32"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select
                    value={form.visibility}
                    onValueChange={(value) => setForm((current) => ({ ...current, visibility: value as Video['visibility'] }))}
                  >
                    <SelectTrigger id="visibility">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EDITABLE_VISIBILITY_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {capitalize(option)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Video ID</Label>
                  <Input value={video.id} readOnly />
                </div>
              </div>

              <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">Allow comments</p>
                    <p className="text-xs text-muted-foreground">Enable viewer comments on this video.</p>
                  </div>
                  <Switch checked={form.allowComments} onCheckedChange={(checked) => setForm((current) => ({ ...current, allowComments: checked }))} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">Allow likes</p>
                    <p className="text-xs text-muted-foreground">Enable public likes for viewers.</p>
                  </div>
                  <Switch checked={form.allowLikes} onCheckedChange={(checked) => setForm((current) => ({ ...current, allowLikes: checked }))} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">Allow bookmarks</p>
                    <p className="text-xs text-muted-foreground">Let viewers save timestamps.</p>
                  </div>
                  <Switch checked={form.allowBookmarks} onCheckedChange={(checked) => setForm((current) => ({ ...current, allowBookmarks: checked }))} />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                {hasChanges && (
                  <Button variant="outline" onClick={discardChanges} disabled={isSaving}>
                    Discard
                  </Button>
                )}
                <Button variant="outline" className="gap-2" onClick={saveChanges} disabled={isSaving || !hasChanges}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Video Overview</CardTitle>
                <CardDescription>Key details and the current publish state.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video overflow-hidden rounded-lg border bg-muted">
                  <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1.5">
                    {video.visibility === 'public' ? <Globe className="h-3 w-3" /> : video.visibility === 'private' ? <Lock className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                    {visibilityLabel}
                  </Badge>
                  <Badge
                    className={`gap-1.5 ${
                      video.status === 'Ready'
                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                        : video.status === 'Processing' || video.status === 'Uploading'
                          ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                          : 'bg-red-100 text-red-800 hover:bg-red-100'
                    }`}
                  >
                    {video.status === 'Ready' ? <CheckCircle className="h-3 w-3" /> : video.status === 'Failed' ? <AlertCircle className="h-3 w-3" /> : <Loader2 className="h-3 w-3 animate-spin" />}
                    {capitalize(video.status ?? 'unknown')}
                  </Badge>
                </div>
                <div className="grid gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>{video.views} views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Uploaded {video.uploadedAt.toLocaleDateString()}</span>
                  </div>
                  {video.updatedAt && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Updated {video.updatedAt.toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Managed by admin/editor roles only</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {video.categories.map((category) => (
                    <Badge key={category} variant="secondary">
                      {capitalize(category)}
                    </Badge>
                  ))}
                  {video.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      #{capitalize(tag)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Processing Status</CardTitle>
                <CardDescription>Backend job progress and readiness state.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {processingStatus ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{processingStatus.jobType || 'Video processing'}</span>
                        <span>{processingStatus.progress !== null ? `${processingStatus.progress}%` : 'Pending'}</span>
                      </div>
                      <Progress value={processingProgress} className="h-3 border border-border bg-muted" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Status: {processingStatus.jobStatus || processingStatus.videoStatus}</p>
                      {processingStatus.errorMessage && <p className="mt-2 text-destructive">{processingStatus.errorMessage}</p>}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No active processing job is currently associated with this video.</p>
                )}
                {isProcessing && (
                  <Badge variant="secondary" className="w-fit">
                    Active processing
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <VideoAccessGrantsCard videoId={video.id} canManageAccess />
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this video?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the video and its associated metadata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteVideo} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this video?</AlertDialogTitle>
            <AlertDialogDescription>
              Archiving keeps the video available for recovery while removing it from active management lists.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isArchiving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={archiveVideo} disabled={isArchiving}>
              {isArchiving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
