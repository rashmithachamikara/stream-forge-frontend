'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { apiClient } from '@/shared/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Clock,
  Download,
  Eye,
  Loader2,
  MessageSquare,
  MousePointerClick,
  Play,
  ThumbsUp,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  ActiveViewers,
  AnalyticsBreakdownItem,
  AnalyticsSummary,
  AnalyticsTimeSeriesPoint,
  AuthBreakdown,
  PeakWatchTimeItem,
  RankedAnalyticsKind,
  RankedVideoAnalytics,
} from '@/features/admin/types';

type DateRangeState = {
  start: string;
  end: string;
};

const formatDateInput = (date: Date) => date.toISOString().slice(0, 10);

const getDefaultDateRange = (): DateRangeState => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);

  return {
    start: formatDateInput(start),
    end: formatDateInput(end),
  };
};

const toDateRange = (dateRange: DateRangeState) => ({
  from: new Date(`${dateRange.start}T00:00:00.000Z`),
  to: new Date(`${dateRange.end}T23:59:59.999Z`),
});

const formatNumber = (value: number) => value.toLocaleString();

const formatDuration = (seconds: number) => {
  const totalSeconds = Math.round(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">{message}</div>
);

const BreakdownList = ({ items, emptyLabel }: { items: AnalyticsBreakdownItem[]; emptyLabel: string }) => {
  const maxValue = Math.max(...items.map((item) => item.value), 0);

  if (items.length === 0) {
    return <EmptyState message={emptyLabel} />;
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 5).map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-muted-foreground">{item.label}</span>
            <span className="font-medium">{formatNumber(item.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full border border-border bg-muted">
            <div
              className="h-full bg-chart-5"
              style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRangeState>(getDefaultDateRange);
  const [rankingKind, setRankingKind] = useState<Exclude<RankedAnalyticsKind, 'top'>>('most-watched');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [viewsOverTime, setViewsOverTime] = useState<AnalyticsTimeSeriesPoint[]>([]);
  const [rankedVideos, setRankedVideos] = useState<RankedVideoAnalytics[]>([]);
  const [activeViewers, setActiveViewers] = useState<ActiveViewers | null>(null);
  const [peakWatchTime, setPeakWatchTime] = useState<PeakWatchTimeItem[]>([]);
  const [deviceBreakdown, setDeviceBreakdown] = useState<AnalyticsBreakdownItem[]>([]);
  const [browserBreakdown, setBrowserBreakdown] = useState<AnalyticsBreakdownItem[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<AnalyticsBreakdownItem[]>([]);
  const [tagBreakdown, setTagBreakdown] = useState<AnalyticsBreakdownItem[]>([]);
  const [authBreakdown, setAuthBreakdown] = useState<AuthBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyticsRange = useMemo(() => toDateRange(dateRange), [dateRange]);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [
      summaryResponse,
      viewsResponse,
      rankedResponse,
      activeResponse,
      peakResponse,
      deviceResponse,
      browserResponse,
      categoryResponse,
      tagResponse,
      authResponse,
    ] = await Promise.all([
      apiClient.getAdminAnalyticsSummary(analyticsRange),
      apiClient.getAdminViewsOverTime(analyticsRange),
      apiClient.getAdminRankedVideos(rankingKind, { ...analyticsRange, page: 1, pageSize: 10 }),
      apiClient.getAdminActiveViewers(),
      apiClient.getAdminPeakWatchTime(analyticsRange),
      apiClient.getAdminBreakdown('device', analyticsRange),
      apiClient.getAdminBreakdown('browser', analyticsRange),
      apiClient.getAdminBreakdown('category', analyticsRange),
      apiClient.getAdminBreakdown('tag', analyticsRange),
      apiClient.getAdminAuthBreakdown(analyticsRange),
    ]);

    setSummary(summaryResponse.data ?? null);
    setViewsOverTime(viewsResponse.data ?? []);
    setRankedVideos(rankedResponse.data?.items ?? []);
    setActiveViewers(activeResponse.data ?? null);
    setPeakWatchTime(peakResponse.data ?? []);
    setDeviceBreakdown(deviceResponse.data ?? []);
    setBrowserBreakdown(browserResponse.data ?? []);
    setCategoryBreakdown(categoryResponse.data ?? []);
    setTagBreakdown(tagResponse.data ?? []);
    setAuthBreakdown(authResponse.data ?? null);

    const firstError = [
      summaryResponse,
      viewsResponse,
      rankedResponse,
      activeResponse,
      peakResponse,
      deviceResponse,
      browserResponse,
      categoryResponse,
      tagResponse,
      authResponse,
    ].find((response) => !response.success);

    if (firstError) {
      setError(firstError.error ?? 'Some analytics could not be loaded.');
    }

    setIsLoading(false);
  }, [analyticsRange, rankingKind]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const chartData = viewsOverTime.map((point) => ({
    date: point.periodStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    views: point.viewCount,
  }));

  const peakChartData = peakWatchTime.map((item) => ({
    hour: item.hourLabel,
    activity: item.watchActivityCount,
  }));

  const authItems: AnalyticsBreakdownItem[] = authBreakdown
    ? [
        { label: 'Authenticated', value: authBreakdown.authenticatedViewCount },
        { label: 'Anonymous', value: authBreakdown.anonymousViewCount },
      ]
    : [];

  const stats = [
    {
      label: 'Total Views',
      value: formatNumber(summary?.totalViews ?? 0),
      icon: Play,
    },
    {
      label: 'Unique Viewers',
      value: formatNumber(summary?.uniqueViewers ?? 0),
      icon: Users,
    },
    {
      label: 'Total Watch Time',
      value: formatDuration(summary?.totalWatchTime ?? 0),
      icon: Clock,
    },
    {
      label: 'Avg Completion',
      value: `${Math.round(summary?.averageCompletionRate ?? 0)}%`,
      icon: TrendingUp,
    },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    const response = await apiClient.downloadAdminAnalyticsOverview(analyticsRange);

    if (response.success && response.data) {
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `streamforge-analytics-${dateRange.start}-${dateRange.end}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      setError(response.error ?? 'Failed to download analytics export');
    }

    setIsExporting(false);
  };

  return (
    <DashboardLayout title="Analytics Dashboard" requiredRoles={['admin']}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.035em] text-foreground md:text-4xl">Analytics</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Track playback, watch time, engagement, and audience patterns across your video platform.
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Platform playback and engagement metrics.</CardDescription>
            </div>
            <Button variant="outline" className="gap-2 bg-background/70" onClick={() => void handleExport()} disabled={isExporting}>
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export CSV
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-foreground">Start Date</label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(event) => setDateRange((current) => ({ ...current, start: event.target.value }))}
              />
            </div>
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-foreground">End Date</label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(event) => setDateRange((current) => ({ ...current, end: event.target.value }))}
              />
            </div>
            <Button onClick={() => void loadAnalytics()} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Card key={stat.label} className="transition-transform duration-300 hover:-translate-y-0.5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                  <Icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold tracking-[-0.03em]">{isLoading ? '-' : stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Views Over Time</CardTitle>
              <CardDescription>Counted views for the selected period.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <EmptyState message="Loading chart..." />
              ) : chartData.length > 0 ? (
                <ChartContainer config={{ views: { label: 'Views', color: '#0891b2' } }} className="h-72">
                  <BarChart data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={40} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="views"
                      fill="var(--color-views)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              ) : (
                <EmptyState message="No view data for this range." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Viewers</CardTitle>
              <CardDescription>Recent playback activity window.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-3xl font-bold">
                  <Activity className="h-6 w-6 text-chart-5" />
                  {isLoading ? '-' : formatNumber(activeViewers?.activeViewerCount ?? 0)}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Last {activeViewers?.windowMinutes ?? 0} minutes
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completion count</p>
                <p className="text-2xl font-semibold">{formatNumber(summary?.completionCount ?? 0)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Video Rankings</CardTitle>
              <CardDescription>Ranked by selected analytics metric.</CardDescription>
            </div>
            <Tabs value={rankingKind} onValueChange={(value) => setRankingKind(value as typeof rankingKind)}>
              <TabsList>
                <TabsTrigger value="most-watched">Watched</TabsTrigger>
                <TabsTrigger value="most-liked">Liked</TabsTrigger>
                <TabsTrigger value="most-commented">Commented</TabsTrigger>
                <TabsTrigger value="most-engaged">Engaged</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <EmptyState message="Loading ranked videos..." />
            ) : rankedVideos.length > 0 ? (
              <div className="space-y-3">
                {rankedVideos.map((video, index) => (
                  <div key={video.videoId} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        #{index + 1} {video.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatNumber(video.viewCount)} views, {formatDuration(video.totalWatchTime)} watched
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        {formatNumber(video.likeCount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {formatNumber(video.commentCount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MousePointerClick className="h-4 w-4" />
                        {formatNumber(video.engagementScore)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No ranked videos for this range." />
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Peak Watch Time</CardTitle>
            </CardHeader>
            <CardContent>
              {peakChartData.length > 0 ? (
                <ChartContainer config={{ activity: { label: 'Activity', color: '#16a34a' } }} className="h-64">
                  <BarChart data={peakChartData} margin={{ left: 8, right: 16, bottom: 8 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="hour"
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                      tickMargin={8}
                    />
                    <YAxis tickLine={false} axisLine={false} width={36} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="activity" fill="var(--color-activity)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <EmptyState message="No peak activity data." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Device Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <BreakdownList items={deviceBreakdown} emptyLabel="No device data." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Browser Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <BreakdownList items={browserBreakdown} emptyLabel="No browser data." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Auth Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <BreakdownList items={authItems} emptyLabel="No auth breakdown data." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <BreakdownList items={categoryBreakdown} emptyLabel="No category data." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tag Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <BreakdownList items={tagBreakdown} emptyLabel="No tag data." />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
