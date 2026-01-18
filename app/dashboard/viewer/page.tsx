'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Eye, Clock, Bookmark } from 'lucide-react';
import { Video } from '@/types';

export default function ViewerDashboard() {
  const [videos] = useState<Video[]>([
    {
      id: '1',
      title: 'Getting Started with Stream Forge',
      description: 'Learn the basics of our platform in this comprehensive tutorial.',
      thumbnail: '/placeholder.jpg',
      duration: 600,
      uploadedBy: 'Jane Editor',
      uploadedAt: new Date('2024-02-15'),
      views: 234,
      categories: ['Tutorial', 'Onboarding'],
      tags: ['intro', 'basics', 'getting-started'],
      visibility: 'public',
      hlsUrl: 'https://example.com/hls/video1.m3u8',
      transcodedVersions: [
        { resolution: '1080p', format: 'H.264', bitrate: '5000kbps', url: 'https://example.com/1080p' },
      ],
    },
    {
      id: '2',
      title: 'Advanced Features Tour',
      description: 'Explore the advanced features and capabilities of Stream Forge.',
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
    {
      id: '3',
      title: 'Company Training Session',
      description: 'Q1 2024 company-wide training on new processes.',
      thumbnail: '/placeholder.jpg',
      duration: 2400,
      uploadedBy: 'Jane Editor',
      uploadedAt: new Date('2024-02-05'),
      views: 89,
      categories: ['Training'],
      tags: ['company', 'training', 'q1'],
      visibility: 'public',
      hlsUrl: 'https://example.com/hls/video3.m3u8',
      transcodedVersions: [],
    },
    {
      id: '4',
      title: 'Product Demo',
      description: 'See our new features in action.',
      thumbnail: '/placeholder.jpg',
      duration: 900,
      uploadedBy: 'Jane Editor',
      uploadedAt: new Date('2024-01-28'),
      views: 342,
      categories: ['Demo'],
      tags: ['product', 'demo', 'new-features'],
      visibility: 'public',
      hlsUrl: 'https://example.com/hls/video4.m3u8',
      transcodedVersions: [],
    },
  ]);

  const recentVideos = [...videos].sort(
    (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()
  );

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const VideoCard = ({ video }: { video: Video }) => (
    <Card className="overflow-hidden hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 cursor-pointer group border-border/50 hover:border-primary/30">
      <div className="relative aspect-video bg-gradient-to-br from-secondary to-secondary/50 dark:from-primary/15 dark:to-accent/10 flex items-center justify-center overflow-hidden">
        <Play className="w-12 h-12 text-primary opacity-30 group-hover:opacity-60 group-hover:scale-110 transition-all duration-300" />
        <Badge className="absolute top-2 right-2 bg-black/80 text-white">
          {formatDuration(video.duration)}
        </Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">{video.title}</h3>
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{video.description}</p>

        <div className="flex flex-wrap gap-1 mb-3">
          {video.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs bg-secondary/50 dark:bg-muted/30 border-border/50">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 pb-4 border-b border-border/30">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {video.views}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {video.uploadedAt.toLocaleDateString()}
          </span>
        </div>

        <Button className="w-full gap-2 h-9 gradient-primary font-medium text-white" variant="default">
          <Play className="w-4 h-4" />
          Play
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout title="Watch Videos" requiredRoles={['viewer']}>
      <div className="space-y-8">
        {/* Welcome Card */}
        <Card className="gradient-primary border-0 shadow-lg dark:shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-black/5 to-transparent dark:from-black/20 dark:to-transparent" />
          <CardHeader className="relative z-10">
            <CardTitle className="text-white text-2xl">Welcome Back!</CardTitle>
            <CardDescription className="text-white/80">Continue watching your favorite videos and explore new content</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex flex-wrap gap-2">
              <Button className="gap-2 bg-white text-primary hover:bg-white/90 font-semibold" variant="default">
                <Play className="w-4 h-4" />
                Continue Watching
              </Button>
              <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                Saved for Later
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recently Added Section */}
        <div>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/30">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Recently Added</h2>
              <p className="text-sm text-muted-foreground">Latest videos from your organization</p>
            </div>
            <Button variant="outline" className="border-border/50 hover:bg-secondary bg-transparent">View All</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentVideos.slice(0, 4).map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </div>

        {/* Featured Section */}
        <div>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/30">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Featured Content</h2>
              <p className="text-sm text-muted-foreground">Handpicked videos just for you</p>
            </div>
            <Button variant="outline" className="border-border/50 hover:bg-secondary bg-transparent">View All</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recentVideos.slice(0, 2).map((video) => (
              <Card
                key={video.id}
                className="overflow-hidden hover:shadow-2xl dark:hover:shadow-2xl transition-all duration-300 cursor-pointer group flex flex-col border-border/50 hover:border-primary/30"
              >
                <div className="relative aspect-video bg-gradient-to-br from-secondary to-secondary/50 dark:from-primary/15 dark:to-accent/10 flex items-center justify-center overflow-hidden">
                  <Play className="w-16 h-16 text-primary opacity-30 group-hover:opacity-60 group-hover:scale-110 transition-all duration-300" />
                  <Badge className="absolute top-3 right-3 bg-black/80 text-white">
                    {formatDuration(video.duration)}
                  </Badge>
                </div>
                <CardContent className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">{video.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
                    {video.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {video.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="bg-secondary/50 dark:bg-muted/30 border-border/50">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4 pb-4 border-b border-border/30">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {video.views}
                    </span>
                    <span>{video.uploadedAt.toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1 gap-2 h-10 gradient-primary font-medium text-white">
                      <Play className="w-4 h-4" />
                      Play Now
                    </Button>
                    <Button variant="outline" size="icon" className="h-10 w-10 border-border/50 hover:bg-secondary bg-transparent">
                      <Bookmark className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
