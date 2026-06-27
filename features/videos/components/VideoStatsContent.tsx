'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/shared/lib/api';
import {
  AnalyticsSummary,
  AnalyticsEngagementSummary,
  AnalyticsTimeSeriesPoint,
} from '@/features/admin/types';
import {
  Eye,
  Clock,
  User,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Percent,
  TrendingUp,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface VideoStatsContentProps {
  videoId: string;
}

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

export default function VideoStatsContent({ videoId }: VideoStatsContentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [engagement, setEngagement] = useState<AnalyticsEngagementSummary | null>(null);
  const [timeSeries, setTimeSeries] = useState<AnalyticsTimeSeriesPoint[]>([]);

  useEffect(() => {
    let active = true;

    async function loadStats() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch all 3 data endpoints in parallel
        const [summaryRes, engagementRes, timeSeriesRes] = await Promise.all([
          apiClient.getVideoAnalyticsSummary(videoId, { range: '30d' }),
          apiClient.getVideoEngagementSummary(videoId, { range: '30d' }),
          apiClient.getVideoAnalyticsTimeseries(videoId, { range: '30d' }),
        ]);

        if (!active) return;

        if (summaryRes.success && summaryRes.data) {
          setSummary(summaryRes.data);
        } else {
          throw new Error(summaryRes.error || 'Failed to load video summary stats');
        }

        if (engagementRes.success && engagementRes.data) {
          setEngagement(engagementRes.data);
        }

        if (timeSeriesRes.success && timeSeriesRes.data) {
          setTimeSeries(timeSeriesRes.data);
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : 'An error occurred while loading video stats.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadStats();

    return () => {
      active = false;
    };
  }, [videoId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-xs text-muted-foreground font-mono">Fetching video performance stats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4 border border-destructive/20 bg-destructive/5 rounded-xl">
        <AlertCircle className="h-8 w-8 text-destructive mb-3" />
        <h4 className="text-sm font-semibold text-foreground">Failed to load statistics</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-md font-mono">{error}</p>
      </div>
    );
  }

  // Format timeseries points for chart
  const chartData = timeSeries.map((p) => ({
    date: new Date(p.periodStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    views: p.viewCount,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total Views */}
        <div className="bg-muted/30 border border-border/80 rounded-xl p-4 text-left">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider">Views</span>
            <Eye className="size-4 text-primary shrink-0" />
          </div>
          <p className="text-xl font-bold font-mono tracking-tight text-foreground">
            {(summary?.totalViews ?? 0).toLocaleString()}
          </p>
        </div>

        {/* Watch Time */}
        <div className="bg-muted/30 border border-border/80 rounded-xl p-4 text-left">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider">Watch Time</span>
            <Clock className="size-4 text-primary shrink-0" />
          </div>
          <p className="text-xl font-bold font-mono tracking-tight text-foreground">
            {formatDuration(summary?.totalWatchTime ?? 0)}
          </p>
        </div>

        {/* Unique Viewers */}
        <div className="bg-muted/30 border border-border/80 rounded-xl p-4 text-left">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider">Unique Viewers</span>
            <User className="size-4 text-primary shrink-0" />
          </div>
          <p className="text-xl font-bold font-mono tracking-tight text-foreground">
            {(summary?.uniqueViewers ?? 0).toLocaleString()}
          </p>
        </div>

        {/* Avg Completion */}
        <div className="bg-muted/30 border border-border/80 rounded-xl p-4 text-left">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider">Avg Completion</span>
            <Percent className="size-4 text-primary shrink-0" />
          </div>
          <p className="text-xl font-bold font-mono tracking-tight text-foreground">
            {summary?.averageCompletionRate !== undefined && summary?.averageCompletionRate !== null
              ? `${Math.round(summary.averageCompletionRate)}%`
              : '0%'}
          </p>
        </div>
      </div>

      {/* Engagement Stats Grid */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3.5">
        {/* Engagement Score */}
        <div className="bg-muted/30 border border-border/80 rounded-xl p-4 text-left col-span-3 md:col-span-2">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider">Engagement Rating</span>
            <TrendingUp className="size-4 text-primary shrink-0" />
          </div>
          <p className="text-xl font-bold font-mono tracking-tight text-primary">
            {(engagement?.engagementScore ?? 0).toLocaleString()}
          </p>
          {engagement?.engagementRate !== null && engagement?.engagementRate !== undefined && (
            <span className="text-[10px] font-mono text-muted-foreground mt-1 block">
              Rate: {(engagement.engagementRate * 100).toFixed(1)}%
            </span>
          )}
        </div>

        {/* Likes */}
        <div className="bg-muted/30 border border-border/80 rounded-xl p-4 text-left">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider">Likes</span>
            <ThumbsUp className="size-4 text-primary shrink-0" />
          </div>
          <p className="text-xl font-bold font-mono tracking-tight text-foreground">
            {(engagement?.likeCount ?? 0).toLocaleString()}
          </p>
        </div>

        {/* Dislikes */}
        <div className="bg-muted/30 border border-border/80 rounded-xl p-4 text-left">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider">Dislikes</span>
            <ThumbsDown className="size-4 text-primary shrink-0" />
          </div>
          <p className="text-xl font-bold font-mono tracking-tight text-foreground">
            {(engagement?.dislikeCount ?? 0).toLocaleString()}
          </p>
        </div>

        {/* Comments */}
        <div className="bg-muted/30 border border-border/80 rounded-xl p-4 text-left">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider">Comments</span>
            <MessageSquare className="size-4 text-primary shrink-0" />
          </div>
          <p className="text-xl font-bold font-mono tracking-tight text-foreground">
            {(engagement?.commentCount ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Timeseries Graph */}
      {chartData.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-foreground">Views over time</h4>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Last 30 days daily performance</p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="videoStatsViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary, #3b82f6)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--color-primary, #3b82f6)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="var(--color-muted-foreground, #6b7280)"
                  fontSize={8}
                  fontFamily="monospace"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--color-muted-foreground, #6b7280)"
                  fontSize={8}
                  fontFamily="monospace"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-popover, #1f2937)',
                    borderColor: 'var(--color-border, #374151)',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    borderRadius: '8px',
                  }}
                  itemStyle={{ color: 'var(--color-foreground, #f9fafb)' }}
                  labelStyle={{ color: 'var(--color-muted-foreground, #9ca3af)', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  name="Views"
                  stroke="var(--color-primary, #3b82f6)"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#videoStatsViews)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
