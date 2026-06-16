'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Eye, Clock, Bookmark, ArrowRight } from 'lucide-react';
import { mockVideos } from '@/features/videos/data/mockVideos';
import { Video } from '@/features/videos/types';
import { formatDuration } from '@/features/videos/utils';

export default function ViewerDashboard() {
  const router = useRouter();
  const [videos] = useState<Video[]>(mockVideos);

  const recentVideos = [...videos].sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  const heroVideo = recentVideos[0];
  const featuredVideos = recentVideos.slice(1, 3);

  const VideoCard = ({ video }: { video: Video }) => (
    <Card
      className="group h-full cursor-pointer overflow-hidden py-0 transition-transform duration-300 hover:-translate-y-0.5"
      onClick={() => router.push(`/videos/${video.id}`)}
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        <img src={video.thumbnail} alt={video.title} className="media-hover h-full w-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors group-hover:bg-foreground/20">
          <Play className="h-11 w-11 text-white opacity-0 drop-shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:opacity-95" />
        </div>
        <Badge className="absolute right-2 top-2 border-white/15 bg-black/72 text-white">
          {formatDuration(video.duration)}
        </Badge>
      </div>
      <CardContent className="flex flex-1 flex-col p-4">
        <h3 className="mb-2 line-clamp-2 text-sm font-semibold tracking-[-0.01em] text-foreground transition-colors group-hover:text-primary">
          {video.title}
        </h3>
        <p className="mb-4 line-clamp-2 flex-1 text-xs leading-5 text-muted-foreground">{video.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {video.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="border-border/70 bg-background/60 text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            {video.views}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {video.uploadedAt.toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout title="Watch videos" requiredRoles={['admin', 'editor', 'viewer']}>
      <div className="space-y-10">
        <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <Card className="group overflow-hidden py-0">
            <div className="grid min-h-[28rem] lg:grid-cols-[1.05fr_0.95fr]">
              <div className="relative min-h-72 overflow-hidden bg-muted lg:min-h-full">
                {heroVideo && <img src={heroVideo.thumbnail} alt={heroVideo.title} className="media-hover h-full w-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <Badge className="absolute right-4 top-4 border-white/15 bg-black/72 text-white">
                  {heroVideo ? formatDuration(heroVideo.duration) : '0:00'}
                </Badge>
              </div>
              <div className="flex flex-col justify-between p-6 lg:p-8">
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-primary">Continue watching</p>
                  <h1 className="text-balance text-3xl font-semibold tracking-[-0.035em] text-foreground md:text-4xl">
                    {heroVideo?.title ?? 'Your video library is ready'}
                  </h1>
                  <p className="text-pretty text-sm leading-6 text-muted-foreground">
                    {heroVideo?.description ?? 'Browse recent uploads, training content, and internal updates from your organization.'}
                  </p>
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button className="gap-2" onClick={() => heroVideo && router.push(`/videos/${heroVideo.id}`)}>
                    <Play className="h-4 w-4" />
                    Play now
                  </Button>
                  <Button variant="outline" className="gap-2 bg-background/70" onClick={() => router.push('/bookmarks')}>
                    <Bookmark className="h-4 w-4" />
                    Saved videos
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-4">
            {featuredVideos.map((video) => (
              <button
                key={video.id}
                type="button"
                onClick={() => router.push(`/videos/${video.id}`)}
                className="group grid grid-cols-[7.5rem_1fr] overflow-hidden rounded-lg border border-border/70 bg-card text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30"
              >
                <div className="relative overflow-hidden bg-muted">
                  <img src={video.thumbnail} alt={video.title} className="media-hover h-full w-full object-cover" />
                </div>
                <div className="p-4">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">{formatDuration(video.duration)}</p>
                  <h2 className="line-clamp-2 text-sm font-semibold text-foreground">{video.title}</h2>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
                    {video.views} views
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.025em] text-foreground">Recently added</h2>
              <p className="mt-1 text-sm text-muted-foreground">Latest videos published for your organization.</p>
            </div>
            <Button variant="outline" className="gap-2 bg-background/70" onClick={() => router.push('/videos')}>
              View library
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {recentVideos.slice(0, 4).map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
