'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { AuthenticatedThumbnail } from '@/shared/components/AuthenticatedThumbnail';
import { apiClient } from '@/shared/lib/api';
import { capitalize } from '@/shared/lib/utils';
import {
  Category,
  TagSummary,
  Video,
  VideoProcessingStatus,
  VideoTranscription,
} from '@/features/videos/types';
import { VideoAccessGrantsCard } from '@/features/videos/components/VideoAccessGrantsCard';
import { useAuth } from '@/features/auth/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  FileAudio,
  RotateCcw,
  AlertCircle,
  CircleCheck,
} from 'lucide-react';
import { VideoVisibilityBadge } from '@/features/videos/components/VideoVisibilityBadge';
import { VideoStatusBadge } from '@/features/videos/components/VideoStatusBadge';
import {
  formatTranscriptTimestamp,
  getTranscriptionLanguageLabel,
  isActiveTranscription,
  normalizeTranscriptionStatus,
  selectPrimaryTranscription,
} from '@/features/videos/lib/transcriptions';

const EDITABLE_VISIBILITY_OPTIONS = ['public', 'private', 'internal', 'restricted'] as const;
const TRANSCRIPTION_POLL_INTERVAL_MS = 7000;

type ManageFormState = {
  title: string;
  description: string;
  visibility: Video['visibility'];
  categoryId: string | null;
  tagIds: string[];
  allowComments: boolean;
  allowLikes: boolean;
  allowBookmarks: boolean;
};

const getManageFormState = (video: Video): ManageFormState => ({
  title: video.title,
  description: video.description,
  visibility: video.visibility,
  categoryId: video.categoryId ?? null,
  tagIds: video.tagDetails?.map((tag) => tag.id) ?? [],
  allowComments: video.allowComments ?? true,
  allowLikes: video.allowLikes ?? true,
  allowBookmarks: video.allowBookmarks ?? true,
});

const buildRetryPayload = (transcriptions: VideoTranscription[]) => ({
  language: transcriptions[0]?.language ?? null,
  outputFormats: Array.from(
    new Set(
      transcriptions
        .map((transcription) => transcription.format)
        .filter((format): format is string => Boolean(format))
    )
  ),
});

export default function VideoManagePage({ videoId }: { videoId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [video, setVideo] = useState<Video | null>(null);
  const [processingStatus, setProcessingStatus] = useState<VideoProcessingStatus | null>(null);
  const [transcriptions, setTranscriptions] = useState<VideoTranscription[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [availableTags, setAvailableTags] = useState<TagSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isRequestingTranscription, setIsRequestingTranscription] = useState(false);
  const [retryingTranscriptionId, setRetryingTranscriptionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [requestTranscriptionOpen, setRequestTranscriptionOpen] = useState(false);
  const [form, setForm] = useState<ManageFormState>({
    title: '',
    description: '',
    visibility: 'public',
    categoryId: null,
    tagIds: [],
    allowComments: true,
    allowLikes: true,
    allowBookmarks: true,
  });

  const loadTranscriptions = useCallback(async () => {
    const response = await apiClient.getVideoTranscriptions(videoId);

    if (response.success && response.data) {
      setTranscriptions(response.data);
      return response.data;
    }

    setTranscriptions([]);
    return [];
  }, [videoId]);

  useEffect(() => {
    let isMounted = true;

    const loadVideo = async () => {
      setIsLoading(true);
      setError(null);

      const [videoResponse, processingResponse] = await Promise.all([
        apiClient.getVideoById(videoId),
        apiClient.getVideoProcessingStatus(videoId),
      ]);
      await loadTranscriptions();

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
  }, [loadTranscriptions, videoId]);

  useEffect(() => {
    let isMounted = true;

    const loadMetadata = async () => {
      const [categoryResponse, tagResponse] = await Promise.all([
        apiClient.getCategories(),
        apiClient.getTags(undefined, 1, 100),
      ]);

      if (!isMounted) {
        return;
      }

      if (categoryResponse.success && categoryResponse.data) {
        setAvailableCategories(categoryResponse.data);
      }

      if (tagResponse.success && tagResponse.data) {
        setAvailableTags(tagResponse.data.items);
      }
    };

    void loadMetadata();

    return () => {
      isMounted = false;
    };
  }, []);

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

  const savedForm = useMemo(() => (video ? getManageFormState(video) : null), [video]);
  const primaryTranscription = useMemo(
    () => selectPrimaryTranscription(transcriptions, typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'en'),
    [transcriptions]
  );
  const failedTranscriptions = useMemo(
    () => transcriptions.filter((transcription) => normalizeTranscriptionStatus(transcription) === 'failure'),
    [transcriptions]
  );
  const sharedFailureReason = useMemo(() => {
    if (failedTranscriptions.length === 0) {
      return null;
    }

    const failureReasons = Array.from(
      new Set(
        failedTranscriptions
          .map((transcription) => transcription.failureReason?.trim() || transcription.liveStatus?.message?.trim())
          .filter((reason): reason is string => Boolean(reason))
      )
    );

    return failureReasons.length === 1
      ? failureReasons[0]
      : failedTranscriptions[0].failureReason ?? failedTranscriptions[0].liveStatus?.message ?? null;
  }, [failedTranscriptions]);
  const isOwner = Boolean(user && video && user.id === video.uploaderId);
  const canRequestTranscription = Boolean(
    video &&
      video.status === 'Ready' &&
      (user?.role === 'admin' || (user?.role === 'editor' && isOwner))
  );
  const canRetryFailedTranscriptions = Boolean(
    failedTranscriptions.length > 0 &&
      (user?.role === 'admin' || (user?.role === 'editor' && isOwner))
  );
  const hasChanges = Boolean(
    savedForm &&
      (form.title !== savedForm.title ||
        form.description !== savedForm.description ||
        form.visibility !== savedForm.visibility ||
        form.categoryId !== savedForm.categoryId ||
        form.tagIds.length !== savedForm.tagIds.length ||
        form.tagIds.some((tagId, index) => tagId !== savedForm.tagIds[index]) ||
        form.allowComments !== savedForm.allowComments ||
        form.allowLikes !== savedForm.allowLikes ||
        form.allowBookmarks !== savedForm.allowBookmarks)
  );

  const requestTranscription = async () => {
    if (!video) {
      return;
    }

    setIsRequestingTranscription(true);
    setError(null);

    const response = await apiClient.requestVideoTranscription(video.id, {
      language: typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'en',
      outputFormats: ['VTT', 'SRT'],
    });

    if (response.success && response.data) {
      setTranscriptions(response.data);
      setRequestTranscriptionOpen(false);
      toast.success('Transcription requested successfully');
    } else {
      toast.error(response.error ?? 'Failed to request transcription');
    }

    setIsRequestingTranscription(false);
  };

  const retryTranscription = async (targetTranscriptions: VideoTranscription[]) => {
    if (!video || targetTranscriptions.length === 0) {
      return;
    }

    setRetryingTranscriptionId('batch');
    setError(null);

    const response = await apiClient.requestVideoTranscription(video.id, buildRetryPayload(targetTranscriptions));

    if (response.success && response.data) {
      setTranscriptions(response.data);
      toast.success('Transcription retry initiated');
    } else {
      toast.error(response.error ?? 'Failed to retry transcription');
    }

    setRetryingTranscriptionId(null);
  };

  const toggleTag = (tagId: string) => {
    setForm((current) => ({
      ...current,
      tagIds: current.tagIds.includes(tagId)
        ? current.tagIds.filter((currentTagId) => currentTagId !== tagId)
        : [...current.tagIds, tagId],
    }));
  };

  const saveChanges = async () => {
    if (!video || !hasChanges) return;

    setIsSaving(true);
    setError(null);

    const response = await apiClient.updateVideoMetadata(video.id, {
      title: form.title,
      description: form.description,
      visibility: form.visibility,
      categoryId: form.categoryId,
      tagIds: form.tagIds,
      allowComments: form.allowComments,
      allowLikes: form.allowLikes,
      allowBookmarks: form.allowBookmarks,
    });

    if (response.success && response.data) {
      setVideo(response.data);
      setForm(getManageFormState(response.data));
      toast.success('Changes saved successfully');
    } else {
      toast.error(response.error ?? 'Failed to save changes');
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
      toast.success('Video deleted successfully');
      router.push('/videos');
    } else {
      toast.error(response.error ?? 'Failed to delete video');
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
      toast.success('Video archived successfully');
    } else {
      toast.error(response.error ?? 'Failed to archive video');
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
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Manage Video</h1>
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
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
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
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={form.categoryId ?? 'none'}
                    onValueChange={(value) => setForm((current) => ({ ...current, categoryId: value === 'none' ? null : value }))}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No category</SelectItem>
                      {availableCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.length > 0 ? (
                      availableTags.map((tag) => (
                        <Button
                          key={tag.id}
                          type="button"
                          size="sm"
                          variant={form.tagIds.includes(tag.id) ? 'default' : 'outline'}
                          onClick={() => toggleTag(tag.id)}
                        >
                          {tag.name}
                        </Button>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No tags available</p>
                    )}
                  </div>
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
                  <AuthenticatedThumbnail src={video.thumbnail} alt={video.title} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <VideoVisibilityBadge visibility={video.visibility} />
                  {video.status ? <VideoStatusBadge status={video.status} /> : null}
                </div>
                <div className="grid gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Video ID <span className="font-mono">{video.id}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span><span className="font-mono">{video.views}</span> views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Uploaded <span className="font-mono">{video.uploadedAt.toLocaleDateString()}</span></span>
                  </div>
                  {video.updatedAt && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Updated <span className="font-mono">{video.updatedAt.toLocaleDateString()}</span></span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Uploaded by {video.uploadedBy}</span>
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
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-mono">[TASK: {processingStatus.jobType || 'Video processing'}]</span>
                        <span className="font-mono font-semibold text-foreground">
                          {processingStatus.progress !== null ? `${processingStatus.progress}%` : 'Pending'}
                        </span>
                      </div>
                      <Progress value={processingProgress} className="h-2" />
                    </div>
                    
                    {processingStatus.jobStatus === 'Failed' || processingStatus.errorMessage ? (
                      <div className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-xs text-destructive flex items-start gap-2">
                        <AlertCircle className="size-4 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-semibold font-mono tracking-tight text-[10px] uppercase">
                            Processing Failed
                          </p>
                          <p className="font-mono text-[10px] leading-normal break-all">
                            {processingStatus.errorMessage || 'An unknown error occurred during transcoding.'}
                          </p>
                        </div>
                      </div>
                    ) : processingStatus.jobStatus === 'Completed' || video.status === 'Ready' ? (
                      <div className="rounded-md border border-success/20 bg-success/5 px-3 py-2.5 text-xs text-success flex items-start gap-2">
                        <CircleCheck className="size-4 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-semibold font-mono tracking-tight text-[10px] uppercase">
                            Transcoding Complete
                          </p>
                          <p className="text-[10px] leading-normal text-muted-foreground">
                            Video stream has been processed and is ready for playback.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                          <span className="font-semibold text-foreground font-mono tracking-tight text-[10px] uppercase">
                            {processingStatus.jobStatus || 'Processing...'}
                          </span>
                        </div>
                      </div>
                    )}
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

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>Transcriptions</CardTitle>
                    <CardDescription>Request transcripts, monitor status, and retry failed artifacts.</CardDescription>
                  </div>
                  {canRequestTranscription ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => setRequestTranscriptionOpen(true)}
                      disabled={isRequestingTranscription}
                    >
                      {isRequestingTranscription ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FileAudio className="h-3.5 w-3.5" />
                      )}
                      Request
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {primaryTranscription ? (
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          Primary
                        </Badge>
                        <Badge variant="outline" className="font-mono">
                          {getTranscriptionLanguageLabel(primaryTranscription.language)}
                        </Badge>
                        <Badge variant="outline" className="font-mono">
                          {(primaryTranscription.format ?? 'TXT').toUpperCase()}
                        </Badge>
                      </div>
                      {canRetryFailedTranscriptions ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => void retryTranscription(failedTranscriptions)}
                          disabled={retryingTranscriptionId === 'batch'}
                        >
                          {retryingTranscriptionId === 'batch' ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3.5 w-3.5" />
                          )}
                          Retry failed
                        </Button>
                      ) : null}
                    </div>
                    {sharedFailureReason ||
                    primaryTranscription.failureReason ||
                    primaryTranscription.liveStatus?.status === 'failed' ||
                    primaryTranscription.status === 'Failed' ? (
                      <div className="mt-3 rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-xs text-destructive flex items-start gap-2">
                        <AlertCircle className="size-4 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-semibold font-mono tracking-tight text-[10px] uppercase">
                            Transcription Failed
                          </p>
                          <p className="font-mono text-[10px] leading-normal break-all">
                            {sharedFailureReason ||
                              primaryTranscription.failureReason ||
                              primaryTranscription.liveStatus?.message ||
                              'An unknown error occurred during transcription.'}
                          </p>
                        </div>
                      </div>
                    ) : primaryTranscription.status === 'Processing' ||
                      primaryTranscription.liveStatus?.status === 'queued' ||
                      primaryTranscription.liveStatus?.status === 'running' ? (
                      <div className="mt-3 rounded-md border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                          <span className="font-semibold text-foreground font-mono tracking-tight text-[10px] uppercase">
                            Transcribing...
                          </span>
                        </div>
                        {primaryTranscription.liveStatus?.message && (
                          <p className="pl-4 border-l border-border text-xs leading-relaxed text-muted-foreground font-mono text-[10px]">
                            {primaryTranscription.liveStatus.message}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 rounded-md border border-success/20 bg-success/5 px-3 py-2.5 text-xs text-success flex items-start gap-2">
                        <CircleCheck className="size-4 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-semibold font-mono tracking-tight text-[10px] uppercase">
                            Transcription Complete
                          </p>
                          <p className="text-[10px] leading-normal text-muted-foreground">
                            Captions are processed and available for playback.
                          </p>
                        </div>
                      </div>
                    )}
                    {primaryTranscription.liveStatus?.transcribedUntilSeconds !== null &&
                    primaryTranscription.liveStatus?.transcribedUntilSeconds !== undefined &&
                    primaryTranscription.liveStatus.mediaDurationSeconds ? (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Transcribing media</span>
                          <span className="font-mono">
                            {formatTranscriptTimestamp(primaryTranscription.liveStatus.transcribedUntilSeconds)} /{' '}
                            {formatTranscriptTimestamp(primaryTranscription.liveStatus.mediaDurationSeconds)}
                          </span>
                        </div>
                        <Progress
                          value={
                            Math.min(
                              100,
                              (primaryTranscription.liveStatus.transcribedUntilSeconds /
                                primaryTranscription.liveStatus.mediaDurationSeconds) *
                                100
                            ) || 0
                          }
                          className="h-3"
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {transcriptions.length > 0 ? (
                  <div className="space-y-3">
                    {transcriptions.map((transcription) => {
                      const uiStatus = normalizeTranscriptionStatus(transcription);

                      return (
                        <div key={transcription.id} className="rounded-lg border p-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-foreground">
                                  {getTranscriptionLanguageLabel(transcription.language)}
                                </span>
                                <Badge variant="outline" className="font-mono">
                                  {(transcription.format ?? 'TXT').toUpperCase()}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={
                                    uiStatus === 'success'
                                      ? 'border-green-500/25 bg-green-500/10 text-green-700 dark:text-green-300'
                                      : uiStatus === 'failure'
                                        ? 'border-destructive/25 bg-destructive/10 text-destructive'
                                        : 'border-primary/25 bg-primary/10 text-primary'
                                  }
                                >
                                  {transcription.liveStatus?.stage ||
                                    transcription.liveStatus?.status ||
                                    transcription.status ||
                                    'Pending'}
                                </Badge>
                              </div>
                              <div className="space-y-0.5 text-[11px] text-muted-foreground">
                                <p className="font-mono">ID {transcription.id}</p>
                                <p>
                                  Updated{' '}
                                  <span className="font-mono">
                                    {(transcription.updatedAt ?? transcription.createdAt).toLocaleString()}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No transcription artifacts are available for this video yet.
                  </p>
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

      <AlertDialog open={requestTranscriptionOpen} onOpenChange={setRequestTranscriptionOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request transcripts for this video?</AlertDialogTitle>
            <AlertDialogDescription>
              This starts a transcription job for the current video and will generate the configured caption artifacts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRequestingTranscription}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void requestTranscription()}
              disabled={isRequestingTranscription}
            >
              {isRequestingTranscription ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Request transcripts
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
