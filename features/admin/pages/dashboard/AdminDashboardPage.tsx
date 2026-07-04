'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { AuthenticatedThumbnail } from '@/shared/components/AuthenticatedThumbnail';
import { apiClient } from '@/shared/lib/api';
import { Video } from '@/features/videos/types';
import { AdminVideoProcessingJob } from '@/features/admin/types';

interface QueueItem {
  id: string;
  title: string;
  status: string;
  progress: number | null;
}

const formatRelativeDate = (date: Date) => {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  return date.toLocaleDateString();
};

const formatPlaybackDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return `${minutes}:${String(secs).padStart(2, '0')}`;
};

const formatWatchHours = (seconds: number) => {
  const hours = seconds / 3600;
  return `${hours.toFixed(1)}h`;
};

const formatViews = (views: number) => {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return String(views);
};

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVideos: 0,
    totalViews: 0,
    totalWatchTime: 0,
  });

  const [recentVideos, setRecentVideos] = useState<Video[]>([]);
  const [processingVideos, setProcessingVideos] = useState<QueueItem[]>([]);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        const [usersRes, videosRes, analyticsRes, recentRes, procRes] = await Promise.all([
          apiClient.getUsers({ page: 1, pageSize: 1 }),
          apiClient.getVideos({ page: 1, pageSize: 1 }),
          apiClient.getAdminAnalyticsSummary(),
          apiClient.getVideos({ sort: 'recentlyCreated', pageSize: 5 }),
          apiClient.getAdminVideoProcessingJobs({ Page: 1, PageSize: 5 }),
        ]);

        if (!active) return;

        // Populate Stats
        let totalUsers = 0;
        let totalVideos = 0;
        let totalViews = 0;
        let totalWatchTime = 0;

        if (usersRes.success && usersRes.data) {
          totalUsers = usersRes.data.totalCount;
        }
        if (videosRes.success && videosRes.data) {
          totalVideos = videosRes.data.totalCount;
        }
        if (analyticsRes.success && analyticsRes.data) {
          totalViews = analyticsRes.data.totalViews;
          totalWatchTime = analyticsRes.data.totalWatchTime;
        }

        setStats({
          totalUsers,
          totalVideos,
          totalViews,
          totalWatchTime,
        });

        // Populate Recent Videos
        if (recentRes.success && recentRes.data) {
          setRecentVideos(recentRes.data.items);
        }

        // Populate Processing Queue
        if (procRes.success && procRes.data) {
          const items = procRes.data.items.map((job: AdminVideoProcessingJob) => ({
            id: job.jobKey ?? job.videoId,
            title: job.videoTitle ?? 'Untitled video',
            status: job.status ?? 'Unknown',
            progress: job.progress,
          }));
          setProcessingVideos(items);
        } else {
          setProcessingVideos([]);
        }
      } catch (err) {
        console.error('Failed to load admin dashboard data:', err);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  return (
    <DashboardLayout title="Admin Dashboard" requiredRoles={['admin']}>
      <div className="space-y-8">
        {/* Header Title Section */}
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
            Admin dashboard
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Platform overview</h1>
        </div>

        {/* Flat KPI Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Active Users
            </div>
            <div className="text-2xl font-bold font-mono mt-1">
              {stats.totalUsers}
            </div>
            <div className="text-[11px] font-mono text-success mt-1">
              ▲ +12%
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Total Videos
            </div>
            <div className="text-2xl font-bold font-mono mt-1">
              {stats.totalVideos}
            </div>
            <div className="text-[11px] font-mono text-success mt-1">
              ▲ +8%
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Views (30d)
            </div>
            <div className="text-2xl font-bold font-mono mt-1">
              {formatViews(stats.totalViews)}
            </div>
            <div className="text-[11px] font-mono text-success mt-1">
              ▲ +23%
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Watch Time
            </div>
            <div className="text-2xl font-bold font-mono mt-1">
              {formatWatchHours(stats.totalWatchTime)}
            </div>
            <div className="text-[11px] font-mono text-success mt-1">
              ▲ +5%
            </div>
          </div>
        </div>

        {/* 2/3 and 1/3 Split Detail Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {/* Recently Uploaded List (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="border-b border-border pb-3 flex justify-between items-center">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Recently Uploaded
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/users')}
                className="text-xs border-border bg-card hover:bg-accent text-foreground"
              >
                Manage users
              </Button>
            </div>

            {recentVideos.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground border border-dashed border-border rounded-lg bg-card">
                No videos uploaded yet on the platform.
              </div>
            ) : (
              <div className="divide-y divide-border border border-border rounded-lg bg-card overflow-hidden">
                {recentVideos.map((video) => (
                  <div key={video.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <AuthenticatedThumbnail
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-20 h-12 rounded object-cover ring-1 ring-border bg-muted shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/videos/${video.id}`}
                        className="text-sm font-semibold text-foreground hover:text-primary line-clamp-1"
                        title={video.title}
                      >
                        {video.title}
                      </Link>
                      <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2">
                        <span>{video.uploadedBy}</span>
                        <span>·</span>
                        <span>{formatRelativeDate(video.uploadedAt)}</span>
                      </div>
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {formatPlaybackDuration(video.duration)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Processing Queue (1/3 width) */}
          <div className="space-y-4">
            <div className="border-b border-border pb-3 flex justify-between items-center">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Processing Queue
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/processing')}
                className="text-xs border-border bg-card hover:bg-accent text-foreground"
              >
                View queue
              </Button>
            </div>

            <div className="border border-border rounded-lg bg-card p-4">
              {processingVideos.length === 0 ? (
                <div className="text-center py-12 text-xs text-muted-foreground">
                  Queue is empty.
                </div>
              ) : (
                <div className="space-y-4">
                  {processingVideos.map((video) => (
                    <div key={video.id} className="space-y-2">
                      <div className="flex justify-between items-start text-xs">
                        <div className="font-medium text-foreground line-clamp-1 flex-1 pr-2">
                          {video.title}
                        </div>
                        <div className="font-mono text-muted-foreground shrink-0 text-[11px]">
                          {video.progress !== null ? `${Math.round(video.progress)}%` : video.status}
                        </div>
                      </div>
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{
                            width: `${video.progress !== null ? Math.min(100, Math.max(0, video.progress)) : 10}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
