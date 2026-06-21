'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { apiClient } from '@/shared/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  Activity,
  Clock,
  Download,
  Eye,
  Loader2,
  MousePointerClick,
  Play,
  TrendingUp,
  TrendingDown,
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
import { cn } from '@/shared/lib/utils';
import { getVideoThumbnailUrl } from '@/features/videos/lib/playbackUrls';

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

const formatPreciseDuration = (seconds: number) => {
  const totalSeconds = Math.round(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
};

interface BreakdownItem {
  label: string;
  value: number;
}

const BreakdownCard = ({ title, items, emptyLabel, isLoading }: { title: string; items: BreakdownItem[]; emptyLabel: string; isLoading: boolean }) => {
  const total = useMemo(() => items.reduce((sum, item) => sum + item.value, 0), [items]);

  return (
    <div className="group bg-card border border-border rounded-xl p-5 space-y-4">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{title}</p>
      {isLoading ? (
        <div className="text-xs text-muted-foreground py-6 text-center">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-xs text-muted-foreground py-6 text-center">{emptyLabel}</div>
      ) : (
        <div className="space-y-3">
          {items.slice(0, 5).map((item) => {
            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs gap-3">
                  <span className="truncate text-foreground font-medium">{item.label}</span>
                  <span className="font-mono shrink-0 flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity duration-150">({item.value.toLocaleString()})</span>
                    {percentage}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-foreground transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const calculateDelta = (current: number, previous: number) => {
  if (previous === 0) {
    return current > 0 ? '+100%' : '0%';
  }
  const percentage = ((current - previous) / previous) * 100;
  const formatted = percentage.toFixed(1);
  return percentage >= 0 ? `+${formatted}%` : `${formatted}%`;
};

function KpiCard({ label, value, delta, icon: Icon, isLoading }: { label: string; value: string; delta: string; icon: any; isLoading: boolean }) {
  const isPositive = !delta.startsWith('-');
  const IconTrend = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between text-muted-foreground mb-3">
        <span className="text-[10px] uppercase tracking-widest font-bold">{label}</span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="text-2xl font-bold tracking-tight text-foreground">{isLoading ? '-' : value}</p>
      {!isLoading && (
        <p className={cn(
          "text-[11px] mt-1 font-medium inline-flex items-center gap-1",
          isPositive ? "text-success" : "text-destructive"
        )}>
          <IconTrend className="size-3" /> {delta}
        </p>
      )}
    </div>
  );
}


type ExtendedRankingKind = Exclude<RankedAnalyticsKind, 'top'> | 'most-watchtime';

export default function AnalyticsDashboard() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRangeState>(getDefaultDateRange);
  const [rankingKind, setRankingKind] = useState<ExtendedRankingKind>('most-watched');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [prevSummary, setPrevSummary] = useState<AnalyticsSummary | null>(null);
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
  const [isRankingsLoading, setIsRankingsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyticsRange = useMemo(() => toDateRange(dateRange), [dateRange]);

  const prevRange = useMemo(() => {
    const current = toDateRange(dateRange);
    const duration = current.to.getTime() - current.from.getTime() + 1;
    return {
      from: new Date(current.from.getTime() - duration),
      to: new Date(current.to.getTime() - duration),
    };
  }, [dateRange]);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [
      summaryResponse,
      prevSummaryResponse,
      viewsResponse,
      activeResponse,
      peakResponse,
      deviceResponse,
      browserResponse,
      categoryResponse,
      tagResponse,
      authResponse,
    ] = await Promise.all([
      apiClient.getAdminAnalyticsSummary(analyticsRange),
      apiClient.getAdminAnalyticsSummary(prevRange),
      apiClient.getAdminViewsOverTime(analyticsRange),
      apiClient.getAdminActiveViewers(),
      apiClient.getAdminPeakWatchTime(analyticsRange),
      apiClient.getAdminBreakdown('device', analyticsRange),
      apiClient.getAdminBreakdown('browser', analyticsRange),
      apiClient.getAdminBreakdown('category', analyticsRange),
      apiClient.getAdminBreakdown('tag', analyticsRange),
      apiClient.getAdminAuthBreakdown(analyticsRange),
    ]);

    setSummary(summaryResponse.data ?? null);
    setPrevSummary(prevSummaryResponse.data ?? null);
    setViewsOverTime(viewsResponse.data ?? []);
    setActiveViewers(activeResponse.data ?? null);
    setPeakWatchTime(peakResponse.data ?? []);
    setDeviceBreakdown(deviceResponse.data ?? []);
    setBrowserBreakdown(browserResponse.data ?? []);
    setCategoryBreakdown(categoryResponse.data ?? []);
    setTagBreakdown(tagResponse.data ?? []);
    setAuthBreakdown(authResponse.data ?? null);

    const firstError = [
      summaryResponse,
      prevSummaryResponse,
      viewsResponse,
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
  }, [analyticsRange, prevRange]);

  const loadRankedVideos = useCallback(async () => {
    setIsRankingsLoading(true);
    const apiKind = rankingKind === 'most-watchtime' ? 'most-watched' : rankingKind;
    const response = await apiClient.getAdminRankedVideos(apiKind, { ...analyticsRange, page: 1, pageSize: 10 });
    if (response.success && response.data) {
      let items = response.data.items ?? [];
      if (rankingKind === 'most-watchtime') {
        items = [...items].sort((a, b) => b.totalWatchTime - a.totalWatchTime);
      }
      setRankedVideos(items);
    }
    setIsRankingsLoading(false);
  }, [analyticsRange, rankingKind]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    void loadRankedVideos();
  }, [loadRankedVideos]);

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

  const authItems: AnalyticsBreakdownItem[] = authBreakdown
    ? [
        { label: 'Signed In', value: authBreakdown.authenticatedViewCount },
        { label: 'Guests', value: authBreakdown.anonymousViewCount },
      ]
    : [];

  const viewsDelta = useMemo(() => calculateDelta(summary?.totalViews ?? 0, prevSummary?.totalViews ?? 0), [summary, prevSummary]);
  const watchTimeDelta = useMemo(() => calculateDelta(summary?.totalWatchTime ?? 0, prevSummary?.totalWatchTime ?? 0), [summary, prevSummary]);
  const uniqueViewersDelta = useMemo(() => calculateDelta(summary?.uniqueViewers ?? 0, prevSummary?.uniqueViewers ?? 0), [summary, prevSummary]);
  const avgCompletionDelta = useMemo(() => calculateDelta(summary?.averageCompletionRate ?? 0, prevSummary?.averageCompletionRate ?? 0), [summary, prevSummary]);

  const maxViews = useMemo(() => {
    return Math.max(...viewsOverTime.map((point) => point.viewCount), 1);
  }, [viewsOverTime]);

  const maxActivity = useMemo(() => {
    return Math.max(...peakWatchTime.map((item) => item.watchActivityCount), 1);
  }, [peakWatchTime]);

  const dateLabels = useMemo(() => {
    if (viewsOverTime.length === 0) return { start: '', mid: '', end: '' };
    const format = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return {
      start: format(viewsOverTime[0].periodStart),
      mid: format(viewsOverTime[Math.floor(viewsOverTime.length / 2)].periodStart),
      end: format(viewsOverTime[viewsOverTime.length - 1].periodStart),
    };
  }, [viewsOverTime]);

  const xAxisLabels = useMemo(() => {
    if (viewsOverTime.length === 0) return [];
    const count = Math.min(7, viewsOverTime.length);
    const format = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return Array.from({ length: count }, (_, i) => {
      const idx = Math.round((i / (count - 1)) * (viewsOverTime.length - 1));
      return {
        label: format(viewsOverTime[idx].periodStart),
        pct: (idx / (viewsOverTime.length - 1)) * 100,
      };
    });
  }, [viewsOverTime]);

  const monthHeatmapData = useMemo(() => {
    if (viewsOverTime.length === 0) return [];
    const maxViews = Math.max(...viewsOverTime.map((p) => p.viewCount), 1);
    const toKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const byDate = new Map<string, number>();
    for (const point of viewsOverTime) {
      const key = toKey(new Date(point.periodStart));
      byDate.set(key, (byDate.get(key) ?? 0) + point.viewCount);
    }
    const start = new Date(viewsOverTime[0].periodStart);
    const end = new Date(viewsOverTime[viewsOverTime.length - 1].periodStart);
    const days: { date: Date; value: number; intensity: number }[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      const value = byDate.get(toKey(cur)) ?? 0;
      const intensity = value > 0
        ? Math.max(0.15, Math.log(value + 1) / Math.log(maxViews + 1))
        : 0;
      days.push({ date: new Date(cur), value, intensity });
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  }, [viewsOverTime]);

  const dayOfWeekData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const totals = [0, 0, 0, 0, 0, 0, 0];
    for (const point of viewsOverTime) {
      // getDay() returns 0=Sun..6=Sat; remap to 0=Mon..6=Sun
      const jsDay = new Date(point.periodStart).getDay();
      const idx = jsDay === 0 ? 6 : jsDay - 1;
      totals[idx] += point.viewCount;
    }
    const max = Math.max(...totals, 1);
    return days.map((label, i) => ({ label, value: totals[i], intensity: totals[i] / max }));
  }, [viewsOverTime]);

  // Fast preset filters that adjust inputs automatically
  const setRangePreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setDateRange({
      start: formatDateInput(start),
      end: formatDateInput(end),
    });
  };

  const handlePresetSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '7d') setRangePreset(7);
    else if (val === '30d') setRangePreset(30);
    else if (val === '90d') setRangePreset(90);
    else if (val === 'ytd') {
      const start = new Date(new Date().getFullYear(), 0, 1);
      setDateRange({
        start: formatDateInput(start),
        end: formatDateInput(new Date()),
      });
    }
  };

  return (
    <DashboardLayout title="Analytics Dashboard" requiredRoles={['admin']}>
      <div className="space-y-8">
        {/* Header Controls Strip */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between border-b border-border pb-5">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Admin · Analytics</p>
            <h1 className="text-2xl font-bold tracking-tight mt-1 text-foreground">Platform analytics</h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-muted-foreground">Presets:</span>
              <Select defaultValue="30d" onValueChange={(val) => handlePresetSelectChange({ target: { value: val } } as React.ChangeEvent<HTMLSelectElement>)}>
                <SelectTrigger className="h-8 w-36 text-xs font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d" className="text-xs">Last 7 days</SelectItem>
                  <SelectItem value="30d" className="text-xs">Last 30 days</SelectItem>
                  <SelectItem value="90d" className="text-xs">Last 90 days</SelectItem>
                  <SelectItem value="ytd" className="text-xs">Year to date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                value={dateRange.start}
                className="w-32 h-8 text-xs font-mono"
                onChange={(event) => setDateRange((current) => ({ ...current, start: event.target.value }))}
              />
              <span className="text-xs text-muted-foreground font-mono">to</span>
              <Input
                type="date"
                value={dateRange.end}
                className="w-32 h-8 text-xs font-mono"
                onChange={(event) => setDateRange((current) => ({ ...current, end: event.target.value }))}
              />
            </div>

            <Button variant="outline" size="sm" className="h-8 font-mono text-xs px-3" onClick={() => void loadAnalytics()} disabled={isLoading}>
              {isLoading ? <Loader2 className="size-3 animate-spin mr-1" /> : null}
              Refresh
            </Button>

            <Button variant="outline" size="sm" className="h-8 font-mono text-xs px-3" onClick={() => void handleExport()} disabled={isExporting}>
              {isExporting ? <Loader2 className="size-3 animate-spin mr-1" /> : <Download className="size-3 mr-1" />}
              Export CSV
            </Button>
          </div>
        </div>

        {error && (
          <div className="border border-destructive/20 bg-destructive/5 rounded-lg p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* KPI Tiles Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Total views" value={formatNumber(summary?.totalViews ?? 0)} delta={viewsDelta} icon={Eye} isLoading={isLoading} />
          <KpiCard label="Total watch time" value={formatDuration(summary?.totalWatchTime ?? 0)} delta={watchTimeDelta} icon={Clock} isLoading={isLoading} />
          <KpiCard label="Unique viewers" value={formatNumber(summary?.uniqueViewers ?? 0)} delta={uniqueViewersDelta} icon={Users} isLoading={isLoading} />
          <KpiCard label="Avg completion" value={`${Math.round(summary?.averageCompletionRate ?? 0)}%`} delta={avgCompletionDelta} icon={Play} isLoading={isLoading} />
        </div>

        {/* Primary Views Chart and Live Stats Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
          {/* Views Over Time */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-baseline justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Views over time</h3>
                <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Daily, selected period</p>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-mono">
                <span className="flex items-center gap-1.5"><span className="size-2 bg-primary rounded-sm" /> Views</span>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">Loading chart...</div>
            ) : viewsOverTime.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">No view data for this range.</div>
            ) : (
              <div>
                <div className="flex items-end gap-1 h-48 px-1">
                  {viewsOverTime.map((point, index) => {
                    const heightPercent = (point.viewCount / maxViews) * 100;
                    const formattedDate = point.periodStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center justify-end gap-1 group h-full relative">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="w-full bg-primary/80 hover:bg-primary rounded-sm transition-all duration-150 cursor-pointer"
                              style={{ height: `${heightPercent}%`, minHeight: point.viewCount > 0 ? '4px' : '0px' }}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" align="center" className="font-mono text-[10px]">
                            <p className="font-semibold">{point.viewCount.toLocaleString()} views</p>
                            <p className="opacity-80 mt-0.5">{formattedDate}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    );
                  })}
                </div>
                <div className="relative mt-3 h-4 text-[10px] font-mono text-muted-foreground px-1">
                  {xAxisLabels.map(({ label, pct }, i) => (
                    <span
                      key={i}
                      className="absolute -translate-x-1/2 whitespace-nowrap"
                      style={{ left: `${pct}%` }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active Viewers & Real-Time Stats */}
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between gap-6">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-4">Active Viewers</p>
              <div className="flex items-center gap-2.5 text-3xl font-bold tracking-tight text-foreground">
                <div className="flex items-end gap-[3px] h-5 w-5 shrink-0 pb-0.5" aria-hidden="true">
                  <style>{`
                    @keyframes signal-wave {
                      0%, 30%, 100% { opacity: 0.35; }
                      50% { opacity: 1; }
                    }
                    .animate-signal-1 { animation: signal-wave 1.2s infinite; }
                    .animate-signal-2 { animation: signal-wave 1.2s infinite 0.2s; }
                    .animate-signal-3 { animation: signal-wave 1.2s infinite 0.4s; }
                    .animate-signal-4 { animation: signal-wave 1.2s infinite 0.6s; }
                  `}</style>
                  <span className="w-[3.2px] bg-emerald-500 rounded-full h-[25%] animate-signal-1" />
                  <span className="w-[3.2px] bg-emerald-500 rounded-full h-[50%] animate-signal-2" />
                  <span className="w-[3.2px] bg-emerald-500 rounded-full h-[75%] animate-signal-3" />
                  <span className="w-[3.2px] bg-emerald-500 rounded-full h-full animate-signal-4" />
                </div>
                {isLoading ? '-' : formatNumber(activeViewers?.activeViewerCount ?? 0)}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Simultaneous views in the last {activeViewers?.windowMinutes ?? 0} minutes.
              </p>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground font-mono">Avg Session Duration</p>
              <p className="text-2xl font-bold tracking-tight text-foreground mt-1">
                {isLoading ? '-' : formatPreciseDuration(summary?.averageWatchTime ?? 0)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Average duration per watch session.</p>
            </div>
            
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground font-mono">Completion Count</p>
              <p className="text-2xl font-bold tracking-tight text-foreground mt-1">
                {isLoading ? '-' : formatNumber(summary?.completionCount ?? 0)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Total fully watched video sessions.</p>
            </div>
          </div>
        </div>

        {/* Video Rankings and Hourly Peak Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Video Rankings */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 border-b border-border pb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Video rankings</h3>
                <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Top performing videos by metrics</p>
              </div>
              <Tabs value={rankingKind} onValueChange={(value) => setRankingKind(value as ExtendedRankingKind)}>
                <TabsList className="bg-muted p-0.5 rounded-md h-fit flex-wrap">
                  <TabsTrigger value="most-watched" className="px-3 py-1 text-[11px] rounded font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground cursor-pointer">Views</TabsTrigger>
                  <TabsTrigger value="most-watchtime" className="px-3 py-1 text-[11px] rounded font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground cursor-pointer">Watch Time</TabsTrigger>
                  <TabsTrigger value="most-liked" className="px-3 py-1 text-[11px] rounded font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground cursor-pointer">Liked</TabsTrigger>
                  <TabsTrigger value="most-commented" className="px-3 py-1 text-[11px] rounded font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground cursor-pointer">Commented</TabsTrigger>
                  <TabsTrigger value="most-engaged" className="px-3 py-1 text-[11px] rounded font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground cursor-pointer">Engaged</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="relative flex-1 min-h-[360px] flex flex-col">
              {isRankingsLoading && (
                <div className="absolute inset-0 bg-background/65 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-lg transition-all">
                  <span className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              )}

              {rankedVideos.length === 0 ? (
                <div className="text-center py-20 text-xs text-muted-foreground flex-1 flex items-center justify-center">
                  {!isRankingsLoading && "No ranked videos for this range."}
                </div>
              ) : (
                <div className={cn("overflow-x-auto flex-1 transition-opacity duration-200", isRankingsLoading && "opacity-40")}>
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border">
                        <th className="font-medium pb-2 w-12 text-center">Rank</th>
                        <th className="font-medium pb-2 pl-4">Title</th>
                        <th className="font-medium pb-2 text-right">Views</th>
                        <th className="font-medium pb-2 text-right">Watch Time</th>
                        <th className="font-medium pb-2 text-right">Likes</th>
                        <th className="font-medium pb-2 text-right">Comments</th>
                        <th className="font-medium pb-2 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rankedVideos.map((video, index) => (
                        <tr
                          key={video.videoId}
                          className="hover:bg-accent/20 transition-colors cursor-pointer"
                          onClick={() => router.push(`/videos/${video.videoId}`)}
                        >
                          <td className="py-2.5 font-mono text-muted-foreground text-center font-semibold">#{index + 1}</td>
                          <td className="py-2.5 pl-4 pr-2">
                            <Link
                              href={`/videos/${video.videoId}`}
                              className="flex items-center gap-2.5 hover:underline group"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <img
                                src={getVideoThumbnailUrl(video.videoId)}
                                alt=""
                                className="w-14 h-8 object-cover rounded ring-1 ring-border bg-muted flex-shrink-0 group-hover:opacity-85 transition-opacity"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder.png';
                                }}
                              />
                              <span className="font-medium text-foreground truncate block max-w-[10rem] sm:max-w-[16rem]" title={video.title}>
                                {video.title}
                              </span>
                            </Link>
                          </td>
                          <td className="py-2.5 text-right font-mono text-foreground">{video.viewCount.toLocaleString()}</td>
                          <td className="py-2.5 text-right font-mono text-muted-foreground">{formatDuration(video.totalWatchTime)}</td>
                          <td className="py-2.5 text-right font-mono text-muted-foreground">{video.likeCount.toLocaleString()}</td>
                          <td className="py-2.5 text-right font-mono text-muted-foreground">{video.commentCount.toLocaleString()}</td>
                          <td className="py-2.5 text-right font-mono text-primary font-semibold">{video.engagementScore.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Peak Watch Time + Month Heatmap stacked */}
          <div className="flex flex-col gap-6 h-full">
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Peak watch time</h3>
              <p className="text-[11px] text-muted-foreground font-mono">Activity by hour of the day</p>
            </div>
            
            {isLoading ? (
              <div className="flex h-36 items-center justify-center text-xs text-muted-foreground py-6">Loading chart...</div>
            ) : peakWatchTime.length === 0 ? (
              <div className="flex h-36 items-center justify-center text-xs text-muted-foreground py-6">No peak activity data.</div>
            ) : (
              <div className="mt-6">
                <div className="flex items-end gap-1 h-36 px-1">
                  {peakWatchTime.map((item, index) => {
                    const heightPercent = (item.watchActivityCount / maxActivity) * 100;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center justify-end gap-1 group h-full relative">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="w-full bg-success/80 hover:bg-success rounded-sm transition-all duration-150 cursor-pointer"
                              style={{ height: `${heightPercent}%`, minHeight: item.watchActivityCount > 0 ? '3px' : '0px' }}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" align="center" className="font-mono text-[10px]">
                            <p className="font-semibold">{item.watchActivityCount.toLocaleString()} events</p>
                            <p className="opacity-80 mt-0.5">{item.hourLabel}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    );
                  })}
                </div>
              <div className="flex justify-between mt-3 text-[10px] font-mono text-muted-foreground px-1">
                  <span>12 AM</span>
                  <span>12 PM</span>
                  <span>11 PM</span>
                </div>
                {(() => {
                  const peak = peakWatchTime.reduce((a, b) => a.watchActivityCount >= b.watchActivityCount ? a : b);
                  const offPeak = peakWatchTime.reduce((a, b) => a.watchActivityCount <= b.watchActivityCount ? a : b);
                  return (
                    <div className="flex gap-2 mt-4">
                      <div className="flex-1 flex items-center gap-2 bg-success/10 border border-success/20 rounded-lg px-3 py-2">
                        <span className="text-success text-base leading-none">↑</span>
                        <div>
                          <p className="text-[9px] font-mono uppercase tracking-wider text-success/70">Peak</p>
                          <p className="text-xs font-semibold text-foreground mt-0.5">{peak.hourLabel}</p>
                        </div>
                      </div>
                      <div className="flex-1 flex items-center gap-2 bg-muted/60 border border-border rounded-lg px-3 py-2">
                        <span className="text-muted-foreground text-base leading-none">↓</span>
                        <div>
                          <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Off-peak</p>
                          <p className="text-xs font-semibold text-foreground mt-0.5">{offPeak.hourLabel}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                {dayOfWeekData.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Views by day of week</p>
                    <div className="flex gap-1">
                      {dayOfWeekData.map(({ label, value, intensity }) => (
                        <Tooltip key={label}>
                          <TooltipTrigger asChild>
                            <div className="flex-1 flex flex-col items-center gap-1 cursor-default">
                              <div
                                className="w-full rounded-sm transition-all duration-300"
                                style={{
                                  height: '28px',
                                  backgroundColor: `color-mix(in oklch, var(--success) ${Math.round(Math.max(0.08, intensity) * 100)}%, transparent)`,
                                  border: `1px solid color-mix(in oklch, var(--success) 15%, transparent)`,
                                }}
                              />
                              <span className="text-[9px] font-mono text-muted-foreground">{label}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="font-mono text-[10px]">
                            <p className="font-semibold">{value.toLocaleString()} views</p>
                            <p className="opacity-70 mt-0.5">{label}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Month Heatmap Card */}
          <div className="bg-card border border-border rounded-xl p-6 flex-1">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-foreground mb-1">Activity heatmap</h3>
              <p className="text-[11px] text-muted-foreground font-mono">Views per day over selected period</p>
            </div>
            {isLoading ? (
              <div className="text-xs text-muted-foreground py-6 text-center">Loading...</div>
            ) : monthHeatmapData.length === 0 ? (
              <div className="text-xs text-muted-foreground py-6 text-center">No data for selected range.</div>
            ) : (() => {
              // Group days into weeks (columns), starting Monday
              const firstDay = monthHeatmapData[0].date;
              const startOffset = (firstDay.getDay() + 6) % 7; // Mon=0
              const padded = [...Array(startOffset).fill(null), ...monthHeatmapData];
              const weeks: (typeof monthHeatmapData[0] | null)[][] = [];
              for (let i = 0; i < padded.length; i += 7) {
                weeks.push(padded.slice(i, i + 7));
              }
              const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
              return (
                <div>
                  <div className="flex gap-0.5 w-full">
                    {/* Day-of-week labels */}
                    <div className="flex flex-col gap-0.5 mr-1 shrink-0">
                      {dayLabels.map((d, i) => (
                        <div key={i} className="h-[10px] w-3 flex items-center">
                          <span className="text-[8px] font-mono text-muted-foreground leading-none">{d}</span>
                        </div>
                      ))}
                    </div>
                    {/* Week columns */}
                    {weeks.map((week, wi) => (
                      <div key={wi} className="flex flex-col gap-0.5 flex-1">
                        {Array.from({ length: 7 }).map((_, di) => {
                          const cell = week[di] ?? null;
                          if (!cell) return <div key={di} className="h-[10px] w-full rounded-[2px] border border-border/40" />;
                          return (
                            <Tooltip key={di}>
                              <TooltipTrigger asChild>
                                <div
                                  className={`h-[10px] w-full rounded-[2px] cursor-default transition-all duration-150 hover:ring-1 hover:ring-success/60 ${cell.value === 0 ? 'border border-border' : ''}`}
                                  style={cell.value > 0 ? { backgroundColor: `color-mix(in oklch, var(--success) ${Math.round(cell.intensity * 100)}%, transparent)` } : undefined}
                                />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="font-mono text-[10px]">
                                <p className="font-semibold">{cell.value.toLocaleString()} views</p>
                                <p className="opacity-70 mt-0.5">{cell.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  {/* Legend */}
                  <div className="flex items-center gap-1.5 mt-3">
                    <span className="text-[9px] font-mono text-muted-foreground">Less</span>
                    {[0.07, 0.25, 0.5, 0.75, 1].map((op) => (
                      <div key={op} className="h-[10px] w-[10px] rounded-[2px]" style={{ backgroundColor: `color-mix(in oklch, var(--success) ${Math.round(op * 100)}%, transparent)` }} />
                    ))}
                    <span className="text-[9px] font-mono text-muted-foreground">More</span>
                  </div>
                </div>
              );
            })()}
          </div>
          </div>{/* end flex-col wrapper */}
        </div>

        {/* Breakdown Widgets Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <BreakdownCard title="BY DEVICE" items={deviceBreakdown} emptyLabel="No device data." isLoading={isLoading} />
          <BreakdownCard title="BY BROWSER" items={browserBreakdown} emptyLabel="No browser data." isLoading={isLoading} />
          <BreakdownCard title="AUDIENCE" items={authItems} emptyLabel="No auth breakdown data." isLoading={isLoading} />
          <BreakdownCard title="BY CATEGORY" items={categoryBreakdown} emptyLabel="No category data." isLoading={isLoading} />
          <BreakdownCard title="BY TAG" items={tagBreakdown} emptyLabel="No tag data." isLoading={isLoading} />
        </div>
      </div>
    </DashboardLayout>
  );
}
