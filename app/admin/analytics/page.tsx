'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Play, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { VideoAnalytics } from '@/types';

// Simple line chart component
const LineChart = ({ data }: { data: { date: string; views: number }[] }) => {
  const maxViews = Math.max(...data.map((d) => d.views));
  const chartHeight = 200;

  return (
    <div className="w-full h-64 flex flex-col items-end gap-1">
      <div className="flex items-end gap-0.5 h-full w-full">
        {data.map((point, idx) => {
          const height = (point.views / maxViews) * chartHeight;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t-sm transition-all hover:from-primary/80 hover:to-primary/40"
                style={{ height: `${height}px` }}
                title={`${point.views} views on ${point.date}`}
              />
              <span className="text-xs text-muted-foreground">{point.date}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState({
    start: '2024-02-01',
    end: '2024-02-29',
  });

  // Mock data
  const viewsData = [
    { date: 'Feb 1', views: 120 },
    { date: 'Feb 2', views: 150 },
    { date: 'Feb 3', views: 140 },
    { date: 'Feb 4', views: 180 },
    { date: 'Feb 5', views: 220 },
    { date: 'Feb 6', views: 200 },
    { date: 'Feb 7', views: 250 },
    { date: 'Feb 8', views: 280 },
    { date: 'Feb 9', views: 300 },
    { date: 'Feb 10', views: 320 },
  ];

  const videoAnalytics: VideoAnalytics[] = [
    {
      videoId: '1',
      title: 'Getting Started with Stream Forge',
      views: 234,
      avgWatchTime: 420,
      completionRate: 78,
    },
    {
      videoId: '2',
      title: 'Advanced Features Tour',
      views: 156,
      avgWatchTime: 890,
      completionRate: 65,
    },
    {
      videoId: '3',
      title: 'Company Training Session',
      views: 89,
      avgWatchTime: 1950,
      completionRate: 82,
    },
    {
      videoId: '4',
      title: 'Product Demo',
      views: 342,
      avgWatchTime: 720,
      completionRate: 71,
    },
    {
      videoId: '5',
      title: 'Video Upload Guide',
      views: 198,
      avgWatchTime: 540,
      completionRate: 69,
    },
  ];

  const totalViews = videoAnalytics.reduce((sum, v) => sum + v.views, 0);
  const avgCompletionRate =
    videoAnalytics.reduce((sum, v) => sum + v.completionRate, 0) /
    videoAnalytics.length;
  const totalWatchMinutes = videoAnalytics.reduce((sum, v) => sum + (v.avgWatchTime * v.views) / 60, 0);

  const stats = [
    {
      label: 'Total Views',
      value: totalViews,
      change: 15,
      icon: Play,
    },
    {
      label: 'Total Watch Time',
      value: `${Math.floor(totalWatchMinutes)}m`,
      change: 22,
      icon: Clock,
    },
    {
      label: 'Avg Completion',
      value: `${avgCompletionRate.toFixed(0)}%`,
      change: -5,
      icon: TrendingUp,
    },
    {
      label: 'Active Viewers',
      value: 1240,
      change: 8,
      icon: Users,
    },
  ];

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <DashboardLayout title="Analytics Dashboard" requiredRoles={['admin']}>
      <div className="space-y-8">
        {/* Date Range Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Date Range</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground block mb-2">
                Start Date
              </label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground block mb-2">
                End Date
              </label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button>Update</Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const isPositive = stat.change >= 0;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    {isPositive ? (
                      <ArrowUp className="w-3 h-3 text-green-600" />
                    ) : (
                      <ArrowDown className="w-3 h-3 text-red-600" />
                    )}
                    <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                      {Math.abs(stat.change)}%
                    </span>
                    from previous period
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Views Over Time Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Views Over Time</CardTitle>
            <CardDescription>
              Total views by date for the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart data={viewsData} />
          </CardContent>
        </Card>

        {/* Top Videos */}
        <Card>
          <CardHeader>
            <CardTitle>Most Watched Videos</CardTitle>
            <CardDescription>
              Videos ranked by views and engagement metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Video Title</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Avg Watch Time</TableHead>
                    <TableHead className="text-right">Completion Rate</TableHead>
                    <TableHead className="text-right">Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {videoAnalytics
                    .sort((a, b) => b.views - a.views)
                    .map((video, idx) => (
                      <TableRow key={video.videoId}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-foreground">#{idx + 1}</span>
                            <span className="line-clamp-2">{video.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {video.views}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatTime(video.avgWatchTime)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{
                                  width: `${video.completionRate}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium">
                              {video.completionRate}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className="gap-1">
                            <ArrowUp className="w-3 h-3" />
                            {Math.floor(Math.random() * 30 + 5)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Viewer Demographics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Peak Watch Time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {['9:00 AM', '2:00 PM', '6:00 PM'].map((time, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{time}</span>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${[85, 65, 95][idx]}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {[450, 320, 520][idx]}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Device Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Device Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {['Desktop', 'Mobile', 'Tablet'].map((device, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{device}</span>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${[65, 25, 10][idx]}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {[1235, 456, 189][idx]}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Geographic Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Regions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {['US', 'EU', 'APAC'].map((region, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{region}</span>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${[60, 30, 10][idx]}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {[1234, 567, 234][idx]}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
