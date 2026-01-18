'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Upload, Play, Eye, Edit2, Trash2, Code } from 'lucide-react';
import { Video } from '@/types';
import Image from 'next/image';

export default function EditorDashboard() {
  const [videos, setVideos] = useState<Video[]>([
    {
      id: '1',
      title: 'Getting Started with Stream Forge',
      description: 'Learn the basics of our platform',
      thumbnail: '/placeholder.jpg',
      duration: 600,
      uploadedBy: 'Jane Editor',
      uploadedAt: new Date('2024-02-15'),
      views: 234,
      categories: ['Tutorial', 'Onboarding'],
      tags: ['intro', 'basics'],
      visibility: 'public',
      hlsUrl: 'https://example.com/hls/video1.m3u8',
      transcodedVersions: [
        { resolution: '1080p', format: 'H.264', bitrate: '5000kbps', url: 'https://example.com/1080p' },
        { resolution: '720p', format: 'H.264', bitrate: '2500kbps', url: 'https://example.com/720p' },
      ],
    },
    {
      id: '2',
      title: 'Advanced Features Tour',
      description: 'Explore advanced features',
      thumbnail: '/placeholder.jpg',
      duration: 1200,
      uploadedBy: 'Jane Editor',
      uploadedAt: new Date('2024-02-10'),
      views: 156,
      categories: ['Tutorial'],
      tags: ['advanced', 'features'],
      visibility: 'public',
      hlsUrl: 'https://example.com/hls/video2.m3u8',
      transcodedVersions: [
        { resolution: '720p', format: 'H.264', bitrate: '2500kbps', url: 'https://example.com/720p' },
      ],
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const stats = [
    { label: 'Total Videos', value: videos.length },
    { label: 'Total Views', value: videos.reduce((sum, v) => sum + v.views, 0) },
    { label: 'Total Duration', value: formatDuration(videos.reduce((sum, v) => sum + v.duration, 0)) },
  ];

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
            <Button className="gap-2">
              <Upload className="w-4 h-4" />
              Upload Video
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Search your videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVideos.map((video) => (
                  <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="relative aspect-video bg-muted">
                      {/* Placeholder thumbnail */}
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <Play className="w-8 h-8 text-primary opacity-50" />
                      </div>
                      <Badge className="absolute top-2 right-2 bg-black/80 text-white">
                        {formatDuration(video.duration)}
                      </Badge>
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
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Code className="w-3 h-3" />
                          Embed
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredVideos.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No videos found</p>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Upload Your First Video
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
