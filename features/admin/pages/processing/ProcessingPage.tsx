'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { apiClient } from '@/shared/lib/api';
import {
  AdminTranscriptionJobStatus,
  AdminVideoJobStatus,
  AdminVideoProcessingJob,
} from '@/features/admin/types';
import {
  formatTranscriptTimestamp,
  getTranscriptionLanguageLabel,
} from '@/features/videos/lib/transcriptions';
import { VideoTranscriptionJob } from '@/features/videos/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { cn } from '@/shared/lib/utils';
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  Loader2,
  RefreshCcw,
  RotateCcw,
  ShieldAlert,
  Video,
  Waves,
} from 'lucide-react';

type ProcessingTab = 'video' | 'transcription';
type VideoStatusFilter = AdminVideoJobStatus | 'all';
type TranscriptionStatusFilter = AdminTranscriptionJobStatus | 'all';
type DetailSelection =
  | { kind: 'video'; jobKey: string }
  | { kind: 'transcription'; jobKey: string }
  | null;
type PendingAction =
  | { kind: 'video'; action: 'retry' | 'resync'; jobKey: string; label: string }
  | { kind: 'transcription'; action: 'retry' | 'resync'; jobKey: string; label: string }
  | null;

const POLL_INTERVAL_MS = 4500;

const VIDEO_STATUS_OPTIONS: Array<{ value: VideoStatusFilter; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Processing', label: 'Processing' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Failed', label: 'Failed' },
];

const TRANSCRIPTION_STATUS_OPTIONS: Array<{ value: TranscriptionStatusFilter; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Processing', label: 'Processing' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Failed', label: 'Failed' },
  { value: 'Partial', label: 'Partial' },
];

const formatDateTime = (value: Date | null) => {
  if (!value) {
    return '—';
  }

  return value.toLocaleString();
};

const formatJobStatus = (value: string | null) => value ?? 'Unknown';

const getVideoJobFailure = (job: AdminVideoProcessingJob) =>
  job.errorMessage?.trim() || null;

const getTranscriptionJobFailure = (job: VideoTranscriptionJob) =>
  job.failureReason?.trim() ||
  (job.status === 'Failed' || job.liveStatus?.status === 'Failed'
    ? job.liveStatus?.message?.trim()
    : null) ||
  null;

const getTranscriptionJobProgress = (job: VideoTranscriptionJob) => {
  if (job.status === 'Completed') {
    return 100;
  }

  if (typeof job.liveStatus?.progressPercent === 'number' && !Number.isNaN(job.liveStatus.progressPercent)) {
    return Math.max(0, Math.min(100, job.liveStatus.progressPercent));
  }

  if (
    typeof job.liveStatus?.transcribedUntilSeconds === 'number' &&
    typeof job.liveStatus?.mediaDurationSeconds === 'number' &&
    job.liveStatus.mediaDurationSeconds > 0
  ) {
    return Math.max(
      0,
      Math.min(
        100,
        (job.liveStatus.transcribedUntilSeconds / job.liveStatus.mediaDurationSeconds) * 100
      )
    );
  }

  return null;
};

const isVideoJobActive = (job: AdminVideoProcessingJob) =>
  job.status === 'Pending' || job.status === 'Processing';

const isTranscriptionJobActive = (job: VideoTranscriptionJob) =>
  job.status === 'Pending' || job.status === 'Processing';

const getStatusBadgeClass = (status: string | null) => {
  if (status === 'Completed') {
    return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
  }

  if (status === 'Failed') {
    return 'border-destructive/25 bg-destructive/10 text-destructive';
  }

  if (status === 'Partial') {
    return 'border-warning/25 bg-warning/10 text-warning-foreground';
  }

  return 'border-primary/25 bg-primary/10 text-primary';
};

const EmptyState = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <Icon className="size-5 text-muted-foreground" />
    <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
  </div>
);

const SortIcon = ({
  field,
  sortBy,
  direction,
}: {
  field: string;
  sortBy: string;
  direction: 'asc' | 'desc';
}) => {
  if (sortBy !== field) {
    return <ArrowUpDown className="size-3 text-muted-foreground/60" />;
  }
  return direction === 'asc' ? (
    <ChevronUp className="size-3 text-primary animate-in fade-in duration-200" />
  ) : (
    <ChevronDown className="size-3 text-primary animate-in fade-in duration-200" />
  );
};

export default function ProcessingPage() {
  const [activeTab, setActiveTab] = useState<ProcessingTab>('video');
  const [videoStatusFilter, setVideoStatusFilter] = useState<VideoStatusFilter>('all');
  const [transcriptionStatusFilter, setTranscriptionStatusFilter] =
    useState<TranscriptionStatusFilter>('all');
  const [videoJobs, setVideoJobs] = useState<AdminVideoProcessingJob[]>([]);
  const [transcriptionJobs, setTranscriptionJobs] = useState<VideoTranscriptionJob[]>([]);
  const [isVideoJobsLoading, setIsVideoJobsLoading] = useState(true);
  const [isTranscriptionJobsLoading, setIsTranscriptionJobsLoading] = useState(true);
  const [videoJobsError, setVideoJobsError] = useState<string | null>(null);
  const [transcriptionJobsError, setTranscriptionJobsError] = useState<string | null>(null);
  const [detailSelection, setDetailSelection] = useState<DetailSelection>(null);
  const [videoJobDetail, setVideoJobDetail] = useState<AdminVideoProcessingJob | null>(null);
  const [transcriptionJobDetail, setTranscriptionJobDetail] = useState<VideoTranscriptionJob | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeActionKey, setActiveActionKey] = useState<string | null>(null);

  // New pagination, filtering, and sorting states
  const [videoPage, setVideoPage] = useState(1);
  const [videoPageSize] = useState(10);
  const [videoTotalPages, setVideoTotalPages] = useState(1);
  const [videoTotalCount, setVideoTotalCount] = useState(0);
  const [videoSearch, setVideoSearch] = useState('');
  const [videoSearchInput, setVideoSearchInput] = useState('');
  const [videoHasError, setVideoHasError] = useState(false);
  const [videoSortBy, setVideoSortBy] = useState('createdat');
  const [videoSortDirection, setVideoSortDirection] = useState<'asc' | 'desc'>('desc');

  const [transcriptionPage, setTranscriptionPage] = useState(1);
  const [transcriptionPageSize] = useState(10);
  const [transcriptionTotalPages, setTranscriptionTotalPages] = useState(1);
  const [transcriptionTotalCount, setTranscriptionTotalCount] = useState(0);
  const [transcriptionSearch, setTranscriptionSearch] = useState('');
  const [transcriptionSearchInput, setTranscriptionSearchInput] = useState('');
  const [transcriptionHasError, setTranscriptionHasError] = useState(false);
  const [transcriptionSortBy, setTranscriptionSortBy] = useState('createdat');
  const [transcriptionSortDirection, setTranscriptionSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const timer = setTimeout(() => {
      setVideoSearch(videoSearchInput);
      setVideoPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [videoSearchInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTranscriptionSearch(transcriptionSearchInput);
      setTranscriptionPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [transcriptionSearchInput]);

  const handleSortVideo = (field: string) => {
    if (videoSortBy === field) {
      setVideoSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setVideoSortBy(field);
      setVideoSortDirection('desc');
    }
    setVideoPage(1);
  };

  const handleSortTranscription = (field: string) => {
    if (transcriptionSortBy === field) {
      setTranscriptionSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setTranscriptionSortBy(field);
      setTranscriptionSortDirection('desc');
    }
    setTranscriptionPage(1);
  };

  const loadVideoJobs = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!options.silent) {
        setIsVideoJobsLoading(true);
      }

      const response = await apiClient.getAdminVideoProcessingJobs({
        Page: videoPage,
        PageSize: videoPageSize,
        Status: videoStatusFilter,
        Search: videoSearch || undefined,
        HasError: videoHasError || undefined,
        SortBy: videoSortBy,
        SortDirection: videoSortDirection,
      });

      if (response.success && response.data) {
        setVideoJobs(response.data.items ?? []);
        setVideoTotalPages(response.data.totalPages ?? 1);
        setVideoTotalCount(response.data.totalCount ?? 0);
        setVideoJobsError(null);
      } else {
        setVideoJobs([]);
        setVideoJobsError(response.error ?? 'Failed to load video processing jobs');
      }

      if (!options.silent) {
        setIsVideoJobsLoading(false);
      }
    },
    [videoPage, videoPageSize, videoStatusFilter, videoSearch, videoHasError, videoSortBy, videoSortDirection]
  );

  const loadTranscriptionJobs = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!options.silent) {
        setIsTranscriptionJobsLoading(true);
      }

      const response = await apiClient.getAdminTranscriptionJobs({
        Page: transcriptionPage,
        PageSize: transcriptionPageSize,
        Status: transcriptionStatusFilter,
        Search: transcriptionSearch || undefined,
        HasError: transcriptionHasError || undefined,
        SortBy: transcriptionSortBy,
        SortDirection: transcriptionSortDirection,
      });

      if (response.success && response.data) {
        setTranscriptionJobs(response.data.items ?? []);
        setTranscriptionTotalPages(response.data.totalPages ?? 1);
        setTranscriptionTotalCount(response.data.totalCount ?? 0);
        setTranscriptionJobsError(null);
      } else {
        setTranscriptionJobs([]);
        setTranscriptionJobsError(response.error ?? 'Failed to load transcription jobs');
      }

      if (!options.silent) {
        setIsTranscriptionJobsLoading(false);
      }
    },
    [
      transcriptionPage,
      transcriptionPageSize,
      transcriptionStatusFilter,
      transcriptionSearch,
      transcriptionHasError,
      transcriptionSortBy,
      transcriptionSortDirection,
    ]
  );

  const loadDetail = useCallback(
    async (selection: DetailSelection, options: { silent?: boolean } = {}) => {
      if (!selection) {
        setVideoJobDetail(null);
        setTranscriptionJobDetail(null);
        setDetailError(null);
        return;
      }

      if (!options.silent) {
        setIsDetailLoading(true);
      }

      setDetailError(null);

      if (selection.kind === 'video') {
        const response = await apiClient.getAdminVideoProcessingJob(selection.jobKey);
        if (response.success && response.data) {
          setVideoJobDetail(response.data);
        } else {
          setVideoJobDetail(null);
          setDetailError(response.error ?? 'Failed to load video processing job');
        }
      } else {
        const response = await apiClient.getAdminTranscriptionJob(selection.jobKey);
        if (response.success && response.data) {
          setTranscriptionJobDetail(response.data);
        } else {
          setTranscriptionJobDetail(null);
          setDetailError(response.error ?? 'Failed to load transcription job');
        }
      }

      if (!options.silent) {
        setIsDetailLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    queueMicrotask(() => {
      void loadVideoJobs();
    });
  }, [loadVideoJobs]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadTranscriptionJobs();
    });
  }, [loadTranscriptionJobs]);

  useEffect(() => {
    if (!detailSelection) {
      return;
    }

    queueMicrotask(() => {
      void loadDetail(detailSelection);
    });
  }, [detailSelection, loadDetail]);

  const activeVideoJobsPresent = useMemo(
    () => videoJobs.some(isVideoJobActive),
    [videoJobs]
  );
  const activeTranscriptionJobsPresent = useMemo(
    () => transcriptionJobs.some(isTranscriptionJobActive),
    [transcriptionJobs]
  );
  const activeDetailPresent = useMemo(() => {
    if (!detailSelection) {
      return false;
    }

    if (detailSelection.kind === 'video') {
      return videoJobDetail ? isVideoJobActive(videoJobDetail) : false;
    }

    return transcriptionJobDetail ? isTranscriptionJobActive(transcriptionJobDetail) : false;
  }, [detailSelection, transcriptionJobDetail, videoJobDetail]);

  useEffect(() => {
    const shouldPoll =
      (activeTab === 'video' && activeVideoJobsPresent) ||
      (activeTab === 'transcription' && activeTranscriptionJobsPresent) ||
      activeDetailPresent;

    if (!shouldPoll) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (activeTab === 'video') {
        void loadVideoJobs({ silent: true });
      } else {
        void loadTranscriptionJobs({ silent: true });
      }

      if (detailSelection) {
        void loadDetail(detailSelection, { silent: true });
      }
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [
    activeDetailPresent,
    activeTab,
    activeTranscriptionJobsPresent,
    activeVideoJobsPresent,
    detailSelection,
    loadDetail,
    loadTranscriptionJobs,
    loadVideoJobs,
  ]);

  const patchVideoJob = useCallback((job: AdminVideoProcessingJob) => {
    setVideoJobs((current) =>
      current.map((currentJob) =>
        currentJob.jobKey === job.jobKey ? job : currentJob
      )
    );
  }, []);

  const patchTranscriptionJob = useCallback((job: VideoTranscriptionJob) => {
    setTranscriptionJobs((current) =>
      current.map((currentJob) =>
        currentJob.jobKey === job.jobKey ? job : currentJob
      )
    );
  }, []);

  const executeAction = useCallback(async () => {
    if (!pendingAction) {
      return;
    }

    const actionKey = `${pendingAction.kind}:${pendingAction.action}:${pendingAction.jobKey}`;
    setActiveActionKey(actionKey);
    setActionError(null);

    if (pendingAction.kind === 'video') {
      const response =
        pendingAction.action === 'retry'
          ? await apiClient.retryAdminVideoProcessingJob(pendingAction.jobKey)
          : await apiClient.resyncAdminVideoProcessingJob(pendingAction.jobKey);

      if (response.success && response.data) {
        patchVideoJob(response.data);
        if (
          detailSelection?.kind === 'video' &&
          detailSelection.jobKey === response.data.jobKey
        ) {
          setVideoJobDetail(response.data);
        }
        setPendingAction(null);
      } else {
        setActionError(
          response.error ??
            `Failed to ${pendingAction.action} ${pendingAction.label.toLowerCase()}`
        );
      }
    } else {
      const response =
        pendingAction.action === 'retry'
          ? await apiClient.retryAdminTranscriptionJob(pendingAction.jobKey)
          : await apiClient.resyncAdminTranscriptionJob(pendingAction.jobKey);

      if (response.success && response.data) {
        patchTranscriptionJob(response.data);
        if (
          detailSelection?.kind === 'transcription' &&
          detailSelection.jobKey === response.data.jobKey
        ) {
          setTranscriptionJobDetail(response.data);
        }
        setPendingAction(null);
      } else {
        setActionError(
          response.error ??
            `Failed to ${pendingAction.action} ${pendingAction.label.toLowerCase()}`
        );
      }
    }

    setActiveActionKey(null);
  }, [detailSelection, patchTranscriptionJob, patchVideoJob, pendingAction]);

  const currentDetailTitle =
    detailSelection?.kind === 'video' ? 'Video job details' : 'Transcription job details';

  const currentDetailDescription = '';

  return (
    <DashboardLayout title="Processing" requiredRoles={['admin']}>
      <div className="space-y-8">
        <div className="space-y-2 border-b border-border pb-5">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Admin · Processing
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Processing operations
          </h1>
        </div>

        {actionError ? (
          <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {actionError}
          </div>
        ) : null}

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as ProcessingTab)}
          className="space-y-6"
        >
          <TabsList className="border-b border-border flex gap-6 w-full justify-start h-auto rounded-none bg-transparent p-0 overflow-y-hidden overflow-x-hidden">
            <TabsTrigger
              value="video"
              className="h-auto pb-3 px-0 text-xs font-semibold capitalize border-b-2 -mb-px rounded-none bg-transparent hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent flex items-center gap-1.5 cursor-pointer shadow-none"
            >
              <Video className="size-3.5" />
              Video Jobs <span className="text-muted-foreground ml-0.5 font-mono">({videoTotalCount})</span>
            </TabsTrigger>
            <TabsTrigger
              value="transcription"
              className="h-auto pb-3 px-0 text-xs font-semibold capitalize border-b-2 -mb-px rounded-none bg-transparent hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent flex items-center gap-1.5 cursor-pointer shadow-none"
            >
              <FileText className="size-3.5" />
              Transcription Jobs <span className="text-muted-foreground ml-0.5 font-mono">({transcriptionTotalCount})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="video" className="space-y-4 outline-none mt-0">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Search video jobs..."
                  value={videoSearchInput}
                  onChange={(e) => setVideoSearchInput(e.target.value)}
                  className="h-8 bg-muted border-0 rounded-md px-3 text-xs w-48 focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <Select
                  value={videoStatusFilter}
                  onValueChange={(value) => {
                    setVideoStatusFilter(value as VideoStatusFilter);
                    setVideoPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-40 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VIDEO_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-xs">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 select-none">
                  <Label
                    htmlFor="video-errors-only"
                    className="text-xs text-muted-foreground cursor-pointer font-medium"
                  >
                    Errors Only
                  </Label>
                  <Switch
                    id="video-errors-only"
                    checked={videoHasError}
                    onCheckedChange={(checked) => {
                      setVideoHasError(checked);
                      setVideoPage(1);
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="font-mono h-8"
                  onClick={() => void loadVideoJobs()}
                  disabled={isVideoJobsLoading}
                >
                  {isVideoJobsLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <RefreshCcw className="size-3.5" />
                  )}
                  Refresh
                </Button>
              </div>
            </div>

            {videoJobsError ? (
              <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {videoJobsError}
              </div>
            ) : null}

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="hover:bg-transparent text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
                    <TableHead className="h-9 font-medium px-4">
                      <button
                        onClick={() => handleSortVideo('videotitle')}
                        className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer font-mono"
                      >
                        Video <SortIcon field="videotitle" sortBy={videoSortBy} direction={videoSortDirection} />
                      </button>
                    </TableHead>
                    <TableHead className="h-9 font-medium px-4">Status</TableHead>
                    <TableHead className="h-9 font-medium px-4">
                      <button
                        onClick={() => handleSortVideo('progress')}
                        className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer font-mono"
                      >
                        Progress <SortIcon field="progress" sortBy={videoSortBy} direction={videoSortDirection} />
                      </button>
                    </TableHead>
                    <TableHead className="h-9 font-medium px-4">
                      <button
                        onClick={() => handleSortVideo('createdat')}
                        className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer font-mono"
                      >
                        Created <SortIcon field="createdat" sortBy={videoSortBy} direction={videoSortDirection} />
                      </button>
                    </TableHead>
                    <TableHead className="h-9 font-medium px-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isVideoJobsLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`video-skeleton-${index}`} className="hover:bg-transparent">
                        <TableCell className="min-w-[220px]">
                          <div className="space-y-1.5 animate-pulse">
                            <div className="h-4 w-40 bg-muted/60 rounded" />
                            <div className="h-3 w-48 bg-muted/40 rounded" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="h-5 w-16 bg-muted/50 rounded-full animate-pulse" />
                        </TableCell>
                        <TableCell className="min-w-[150px]">
                          <div className="space-y-2 animate-pulse">
                            <div className="flex justify-between animate-pulse">
                              <div className="h-3 w-10 bg-muted/40 rounded" />
                              <div className="h-3 w-6 bg-muted/40 rounded" />
                            </div>
                            <div className="h-2 w-full bg-muted/40 rounded" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="h-3.5 w-24 bg-muted/40 rounded animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2 animate-pulse">
                            <div className="h-7 w-12 bg-muted/45 rounded" />
                            <div className="h-7 w-12 bg-muted/45 rounded" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : videoJobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="p-0">
                        <EmptyState
                          icon={Video}
                          title="No video jobs in this view"
                          description="Try another status filter or refresh the queue."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    videoJobs.map((job) => {
                      const jobFailure = getVideoJobFailure(job);
                      const retryActionKey = `video:retry:${job.jobKey}`;
                      const resyncActionKey = `video:resync:${job.jobKey}`;
                      const openVideoDetails = () => {
                        if (!job.jobKey) {
                          return;
                        }

                        setDetailSelection({ kind: 'video', jobKey: job.jobKey });
                      };
                      return (
                        <TableRow
                          key={job.jobKey ?? `${job.videoId}-${job.createdAt.toISOString()}`}
                          className={cn(job.jobKey && 'cursor-pointer')}
                          onClick={openVideoDetails}
                        >
                          <TableCell className="min-w-[220px] whitespace-normal">
                            <div className="space-y-1">
                              <Link
                                href={`/videos/${job.videoId}`}
                                className="font-medium text-foreground transition-colors hover:text-primary"
                                onClick={(event) => event.stopPropagation()}
                              >
                                {job.videoTitle ?? 'Untitled video'}
                              </Link>
                              <p className="font-mono text-[11px] text-muted-foreground">
                                {job.videoId}
                              </p>
                              {jobFailure ? (
                                <p className="text-xs text-destructive">{jobFailure}</p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('font-mono', getStatusBadgeClass(job.status))}>
                              {formatJobStatus(job.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="min-w-[150px]">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-[11px] text-muted-foreground">Progress</span>
                                <span className="font-mono text-[11px] text-foreground">
                                  {job.progress}%
                                </span>
                              </div>
                              <Progress value={job.progress} className="h-2" />
                            </div>
                          </TableCell>

                          <TableCell className="font-mono text-muted-foreground">
                            {formatDateTime(job.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openVideoDetails();
                                }}
                                disabled={!job.jobKey}
                              >
                                Details
                              </Button>
                              {!isVideoJobActive(job) ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="font-mono"
                                  onClick={() =>
                                    setPendingAction({
                                      kind: 'video',
                                      action: 'retry',
                                      jobKey: job.jobKey ?? '',
                                      label: job.videoTitle ?? 'video job',
                                    })
                                  }
                                  onClickCapture={(event) => event.stopPropagation()}
                                  disabled={!job.jobKey || activeActionKey === retryActionKey}
                                >
                                  {activeActionKey === retryActionKey ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                  ) : (
                                    <RotateCcw className="size-3.5" />
                                  )}
                                  Retry
                                </Button>
                              ) : null}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="font-mono"
                                onClick={() =>
                                  setPendingAction({
                                    kind: 'video',
                                    action: 'resync',
                                    jobKey: job.jobKey ?? '',
                                    label: job.videoTitle ?? 'video job',
                                  })
                                }
                                onClickCapture={(event) => event.stopPropagation()}
                                disabled={!job.jobKey || activeActionKey === resyncActionKey}
                              >
                                  {activeActionKey === resyncActionKey ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                  ) : (
                                    <ArrowUpDown className="size-3.5" />
                                )}
                                Resync
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {videoTotalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border pt-4 px-1">
                <p className="text-xs text-muted-foreground font-mono">
                  Page {videoPage} of {videoTotalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => setVideoPage((p) => Math.max(1, p - 1))}
                    disabled={videoPage === 1 || isVideoJobsLoading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => setVideoPage((p) => Math.min(videoTotalPages, p + 1))}
                    disabled={videoPage === videoTotalPages || isVideoJobsLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="transcription" className="space-y-4 outline-none mt-0">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Search transcription jobs..."
                  value={transcriptionSearchInput}
                  onChange={(e) => setTranscriptionSearchInput(e.target.value)}
                  className="h-8 bg-muted border-0 rounded-md px-3 text-xs w-48 focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <Select
                  value={transcriptionStatusFilter}
                  onValueChange={(value) => {
                    setTranscriptionStatusFilter(value as TranscriptionStatusFilter);
                    setTranscriptionPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-40 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSCRIPTION_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-xs">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 select-none">
                  <Label
                    htmlFor="transcription-errors-only"
                    className="text-xs text-muted-foreground cursor-pointer font-medium"
                  >
                    Errors Only
                  </Label>
                  <Switch
                    id="transcription-errors-only"
                    checked={transcriptionHasError}
                    onCheckedChange={(checked) => {
                      setTranscriptionHasError(checked);
                      setTranscriptionPage(1);
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="font-mono h-8"
                  onClick={() => void loadTranscriptionJobs()}
                  disabled={isTranscriptionJobsLoading}
                >
                  {isTranscriptionJobsLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <RefreshCcw className="size-3.5" />
                  )}
                  Refresh
                </Button>
              </div>
            </div>

            {transcriptionJobsError ? (
              <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {transcriptionJobsError}
              </div>
            ) : null}

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="hover:bg-transparent text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
                    <TableHead className="h-9 font-medium px-4">Video</TableHead>
                    <TableHead className="h-9 font-medium px-4">Language</TableHead>
                    <TableHead className="h-9 font-medium px-4">
                      <button
                        onClick={() => handleSortTranscription('status')}
                        className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer font-mono"
                      >
                        Status <SortIcon field="status" sortBy={transcriptionSortBy} direction={transcriptionSortDirection} />
                      </button>
                    </TableHead>
                    <TableHead className="h-9 font-medium px-4">Stage</TableHead>
                    <TableHead className="h-9 font-medium px-4">Artifacts</TableHead>
                    <TableHead className="h-9 font-medium px-4">
                      <button
                        onClick={() => handleSortTranscription('updatedat')}
                        className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer font-mono"
                      >
                        Updated <SortIcon field="updatedat" sortBy={transcriptionSortBy} direction={transcriptionSortDirection} />
                      </button>
                    </TableHead>
                    <TableHead className="h-9 font-medium px-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isTranscriptionJobsLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`transcription-skeleton-${index}`} className="hover:bg-transparent">
                        <TableCell className="min-w-[260px]">
                          <div className="space-y-1.5 animate-pulse">
                            <div className="h-4 w-40 bg-muted/60 rounded" />
                            <div className="h-3 w-48 bg-muted/40 rounded" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="h-3.5 w-16 bg-muted/40 rounded animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="h-5 w-16 bg-muted/50 rounded-full animate-pulse" />
                        </TableCell>
                        <TableCell className="min-w-[200px]">
                          <div className="space-y-2 animate-pulse">
                            <div className="h-3.5 w-24 bg-muted/45 rounded mb-1 animate-pulse" />
                            <div className="flex justify-between animate-pulse">
                              <div className="h-3 w-10 bg-muted/40 rounded" />
                              <div className="h-3 w-6 bg-muted/40 rounded" />
                            </div>
                            <div className="h-2 w-full bg-muted/40 rounded animate-pulse" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="h-3.5 w-20 bg-muted/40 rounded animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="h-3.5 w-24 bg-muted/40 rounded animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2 animate-pulse">
                            <div className="h-7 w-12 bg-muted/45 rounded animate-pulse" />
                            <div className="h-7 w-12 bg-muted/45 rounded animate-pulse" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : transcriptionJobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="p-0">
                        <EmptyState
                          icon={Waves}
                          title="No transcription jobs in this view"
                          description="Try another status filter or refresh the queue."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    transcriptionJobs.map((job) => {
                      const progress = getTranscriptionJobProgress(job);
                      const jobFailure = getTranscriptionJobFailure(job);

                      const retryActionKey = `transcription:retry:${job.jobKey}`;
                      const resyncActionKey = `transcription:resync:${job.jobKey}`;
                      const openTranscriptionDetails = () => {
                        if (!job.jobKey) {
                          return;
                        }

                        setDetailSelection({ kind: 'transcription', jobKey: job.jobKey });
                      };
                      return (
                        <TableRow
                          key={job.jobKey ?? `${job.videoId}-${job.createdAt.toISOString()}`}
                          className={cn(job.jobKey && 'cursor-pointer')}
                          onClick={openTranscriptionDetails}
                        >
                          <TableCell className="min-w-[260px] whitespace-normal">
                            <div className="space-y-1">
                              <Link
                                href={`/videos/${job.videoId}`}
                                className="font-medium text-foreground transition-colors hover:text-primary"
                                onClick={(event) => event.stopPropagation()}
                              >
                                {job.videoTitle ?? 'Untitled video'}
                              </Link>
                              <p className="font-mono text-[11px] text-muted-foreground">
                                {job.jobKey ?? 'No job key'}
                              </p>
                              {jobFailure ? (
                                <p className="text-xs text-destructive">{jobFailure}</p>
                              ) : job.liveStatus?.message ? (
                                <p className="text-xs text-muted-foreground">{job.liveStatus.message}</p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            {getTranscriptionLanguageLabel(job.language)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('font-mono', getStatusBadgeClass(job.status))}>
                              {formatJobStatus(job.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="min-w-[200px] whitespace-normal">
                            <div className="space-y-1.5">
                              {job.status !== 'Completed' && (
                                <div className="text-muted-foreground">
                                  {job.status === 'Failed'
                                    ? '—'
                                    : (job.liveStatus?.stage || job.liveStatus?.status || job.status || 'Pending')}
                                </div>
                              )}
                              {progress !== null ? (
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-mono text-[11px] text-muted-foreground">
                                      Progress
                                    </span>
                                    <span className="font-mono text-[11px] text-foreground">
                                      {Math.round(progress)}%
                                    </span>
                                  </div>
                                  <Progress value={progress} className="h-2" />
                                  {typeof job.liveStatus?.transcribedUntilSeconds === 'number' &&
                                  typeof job.liveStatus?.mediaDurationSeconds === 'number' &&
                                  job.liveStatus.mediaDurationSeconds > 0 ? (
                                    <div className="font-mono text-[11px] text-muted-foreground">
                                      {formatTranscriptTimestamp(job.liveStatus.transcribedUntilSeconds)} /{' '}
                                      {formatTranscriptTimestamp(job.liveStatus.mediaDurationSeconds)}
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            {job.artifacts.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {job.artifacts.map((artifact, i) => (
                                  <Badge
                                    key={i}
                                    variant="secondary"
                                    className="font-mono text-[10px] px-1.5 py-0 h-4.5 bg-muted text-muted-foreground hover:bg-muted border-0 rounded-sm"
                                  >
                                    {(artifact.format ?? 'TXT').toUpperCase()}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            {formatDateTime(job.updatedAt ?? job.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openTranscriptionDetails();
                                }}
                                disabled={!job.jobKey}
                              >
                                Details
                              </Button>
                              {!isTranscriptionJobActive(job) ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="font-mono"
                                  onClick={() =>
                                    setPendingAction({
                                      kind: 'transcription',
                                      action: 'retry',
                                      jobKey: job.jobKey ?? '',
                                      label: job.jobKey ?? 'transcription job',
                                    })
                                  }
                                  onClickCapture={(event) => event.stopPropagation()}
                                  disabled={!job.jobKey || activeActionKey === retryActionKey}
                                >
                                  {activeActionKey === retryActionKey ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                  ) : (
                                    <RotateCcw className="size-3.5" />
                                  )}
                                  Retry
                                </Button>
                              ) : null}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="font-mono"
                                onClick={() =>
                                  setPendingAction({
                                    kind: 'transcription',
                                    action: 'resync',
                                    jobKey: job.jobKey ?? '',
                                    label: job.jobKey ?? 'transcription job',
                                  })
                                }
                                onClickCapture={(event) => event.stopPropagation()}
                                disabled={!job.jobKey || activeActionKey === resyncActionKey}
                              >
                                  {activeActionKey === resyncActionKey ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                  ) : (
                                    <ArrowUpDown className="size-3.5" />
                                )}
                                Resync
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {transcriptionTotalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border pt-4 px-1">
                <p className="text-xs text-muted-foreground font-mono">
                  Page {transcriptionPage} of {transcriptionTotalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => setTranscriptionPage((p) => Math.max(1, p - 1))}
                    disabled={transcriptionPage === 1 || isTranscriptionJobsLoading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => setTranscriptionPage((p) => Math.min(transcriptionTotalPages, p + 1))}
                    disabled={transcriptionPage === transcriptionTotalPages || isTranscriptionJobsLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog
        open={Boolean(detailSelection)}
        onOpenChange={(open) => {
          if (!open) {
            setDetailSelection(null);
            setVideoJobDetail(null);
            setTranscriptionJobDetail(null);
            setDetailError(null);
          }
        }}
      >
        <DialogContent className="border border-border bg-card sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{currentDetailTitle}</DialogTitle>
            {currentDetailDescription ? (
              <DialogDescription>{currentDetailDescription}</DialogDescription>
            ) : null}
          </DialogHeader>

          {isDetailLoading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Loading job details...
            </div>
          ) : detailError ? (
            <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {detailError}
            </div>
          ) : detailSelection?.kind === 'video' && videoJobDetail ? (
            <div className="space-y-5">
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={cn('font-mono', getStatusBadgeClass(videoJobDetail.status))}>
                    {formatJobStatus(videoJobDetail.status)}
                  </Badge>
                  <Badge variant="outline" className={cn('font-mono', getStatusBadgeClass(videoJobDetail.videoStatus))}>
                    Video {formatJobStatus(videoJobDetail.videoStatus)}
                  </Badge>
                </div>
                {getVideoJobFailure(videoJobDetail) ? (
                  <p className="mt-3 text-sm text-destructive">{getVideoJobFailure(videoJobDetail)}</p>
                ) : null}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground">Progress</span>
                    <span className="font-mono text-[11px] text-foreground">{videoJobDetail.progress}%</span>
                  </div>
                  <Progress value={videoJobDetail.progress} className="h-2" />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-border p-4 md:col-span-2">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Video</p>
                  <Link
                    href={`/videos/${videoJobDetail.videoId}`}
                    className="mt-2 inline-flex max-w-full items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
                  >
                    <Eye className="size-3.5 text-muted-foreground" />
                    <span className="truncate">
                      {videoJobDetail.videoTitle ?? 'Untitled video'}
                    </span>
                  </Link>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{videoJobDetail.videoId}</p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Job</p>
                  <div className="mt-2 space-y-1.5 font-mono text-xs text-muted-foreground">
                    <p>
                      Key · <span className="text-foreground">{videoJobDetail.jobKey ?? '—'}</span>
                    </p>
                    <p>
                      Type · <span className="text-foreground">{videoJobDetail.jobType ?? '—'}</span>
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Timestamps</p>
                  <div className="mt-2 space-y-1.5 font-mono text-xs text-muted-foreground">
                    <p>Created · {formatDateTime(videoJobDetail.createdAt)}</p>
                    <p>Started · {formatDateTime(videoJobDetail.startedAt)}</p>
                    <p>Completed · {formatDateTime(videoJobDetail.completedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : detailSelection?.kind === 'transcription' && transcriptionJobDetail ? (
            <div className="space-y-5">
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={cn('font-mono', getStatusBadgeClass(transcriptionJobDetail.status))}>
                    {formatJobStatus(transcriptionJobDetail.status)}
                  </Badge>
                  <Badge variant="outline" className="font-mono">
                    {getTranscriptionLanguageLabel(transcriptionJobDetail.language)}
                  </Badge>
                </div>
                {getTranscriptionJobFailure(transcriptionJobDetail) ? (
                  <p className="mt-3 text-sm text-destructive font-mono">
                    {getTranscriptionJobFailure(transcriptionJobDetail)}
                  </p>
                ) : transcriptionJobDetail.liveStatus?.message ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {transcriptionJobDetail.liveStatus.message}
                  </p>
                ) : null}
                {getTranscriptionJobProgress(transcriptionJobDetail) !== null ? (
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-muted-foreground">Progress</span>
                      <span className="font-mono text-[11px] text-foreground">
                        {Math.round(getTranscriptionJobProgress(transcriptionJobDetail) ?? 0)}%
                      </span>
                    </div>
                    <Progress
                      value={getTranscriptionJobProgress(transcriptionJobDetail) ?? 0}
                      className="h-2"
                    />
                    {typeof transcriptionJobDetail.liveStatus?.transcribedUntilSeconds === 'number' &&
                    typeof transcriptionJobDetail.liveStatus?.mediaDurationSeconds === 'number' &&
                    transcriptionJobDetail.liveStatus.mediaDurationSeconds > 0 ? (
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {formatTranscriptTimestamp(transcriptionJobDetail.liveStatus.transcribedUntilSeconds)} /{' '}
                        {formatTranscriptTimestamp(transcriptionJobDetail.liveStatus.mediaDurationSeconds)}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-border p-4 md:col-span-1">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Video</p>
                  <Link
                    href={`/videos/${transcriptionJobDetail.videoId}`}
                    className="mt-2 inline-flex max-w-full items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
                  >
                    <span className="truncate">
                      {transcriptionJobDetail.videoTitle ?? 'Untitled video'}
                    </span>
                  </Link>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{transcriptionJobDetail.videoId}</p>
                </div>
                <div className="rounded-lg border border-border p-4 md:col-span-1">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Lifecycle</p>
                  <div className="mt-2 space-y-1.5 font-mono text-xs text-muted-foreground">
                    <p>Job Key · <span className="text-foreground">{transcriptionJobDetail.jobKey ?? '—'}</span></p>
                    <p>Status · {transcriptionJobDetail.liveStatus?.status ?? transcriptionJobDetail.status ?? '—'}</p>
                    <p>Stage · {transcriptionJobDetail.liveStatus?.stage ?? '—'}</p>
                    <p>Created · {formatDateTime(transcriptionJobDetail.createdAt)}</p>
                    <p>Updated · {formatDateTime(transcriptionJobDetail.updatedAt ?? transcriptionJobDetail.createdAt)}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-border p-4 md:col-span-2">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Worker</p>
                  <div className="mt-2 space-y-1.5 font-mono text-xs text-muted-foreground">
                    <p>Source · {transcriptionJobDetail.source ?? '—'}</p>
                    <p>Model · {transcriptionJobDetail.model ?? '—'}</p>
                    <p>Worker Job · {transcriptionJobDetail.workerJobId ?? '—'}</p>
                    <p>Correlation · {transcriptionJobDetail.correlationId ?? '—'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border">
                <div className="border-b border-border px-4 py-3">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Artifacts
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {transcriptionJobDetail.artifacts.map((artifact) => (
                    <div
                      key={artifact.id}
                      className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            {(artifact.format ?? 'TXT').toUpperCase()}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn('font-mono', getStatusBadgeClass(artifact.status))}
                          >
                            {formatJobStatus(artifact.status)}
                          </Badge>
                        </div>
                        {artifact.failureReason ? (
                          <p className="text-xs text-destructive">{artifact.failureReason}</p>
                        ) : null}
                      </div>
                      <div className="space-y-1 font-mono text-[11px] text-muted-foreground md:text-right">
                        <p>Created · {formatDateTime(artifact.createdAt)}</p>
                        <p>Updated · {formatDateTime(artifact.updatedAt ?? artifact.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={ShieldAlert}
              title="No job selected"
              description="Choose a job from the table to inspect processing details."
            />
          )}

          <DialogFooter>
            {detailSelection?.kind === 'video' && videoJobDetail && !isVideoJobActive(videoJobDetail) ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="font-mono"
                onClick={() =>
                  setPendingAction({
                    kind: 'video',
                    action: 'retry',
                    jobKey: videoJobDetail.jobKey ?? '',
                    label: videoJobDetail.videoTitle ?? 'video job',
                  })
                }
                disabled={!videoJobDetail.jobKey}
              >
                <RotateCcw className="size-3.5" />
                Retry
              </Button>
            ) : null}
            {detailSelection?.kind === 'transcription' &&
            transcriptionJobDetail &&
            !isTranscriptionJobActive(transcriptionJobDetail) ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="font-mono"
                onClick={() =>
                  setPendingAction({
                    kind: 'transcription',
                    action: 'retry',
                    jobKey: transcriptionJobDetail.jobKey ?? '',
                    label: transcriptionJobDetail.jobKey ?? 'transcription job',
                  })
                }
                disabled={!transcriptionJobDetail.jobKey}
              >
                <RotateCcw className="size-3.5" />
                Retry
              </Button>
            ) : null}
            {detailSelection ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="font-mono"
                onClick={() =>
                  setPendingAction({
                    kind: detailSelection.kind,
                    action: 'resync',
                    jobKey: detailSelection.jobKey,
                    label:
                      detailSelection.kind === 'video'
                        ? videoJobDetail?.videoTitle ?? 'video job'
                        : transcriptionJobDetail?.jobKey ?? 'transcription job',
                  })
                }
                disabled={!detailSelection.jobKey}
              >
                <ArrowUpDown className="size-3.5" />
                Resync
              </Button>
            ) : null}
            <Button type="button" variant="secondary" size="sm" onClick={() => setDetailSelection(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(pendingAction)} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.action === 'retry' ? 'Retry this job?' : 'Resync this job?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.action === 'retry'
                ? `This will request a new run for ${pendingAction?.label ?? 'the selected job'} when the backend allows it.`
                : `This will reconcile the current persisted state for ${pendingAction?.label ?? 'the selected job'} with backend processing state.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(activeActionKey)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void executeAction()} disabled={Boolean(activeActionKey)}>
              {activeActionKey ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {pendingAction?.action === 'retry' ? 'Retry job' : 'Resync job'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
