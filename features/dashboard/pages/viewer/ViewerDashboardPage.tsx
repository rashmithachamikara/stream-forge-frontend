'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { PortalHero, PortalPage, PortalSectionHeader } from '@/shared/components/portal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Eye, Clock, Bookmark, Film } from 'lucide-react';
import { mockVideos } from '@/features/videos/data/mockVideos';
import { Video } from '@/features/videos/types';
import { formatDuration } from '@/features/videos/utils';

export default function ViewerDashboard() {
  const router = useRouter();
  const [videos] = useState<Video[]>(mockVideos);

  const recentVideos = [...videos].sort(
    (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()
  );


  const VideoCard = ({ video }: { video: Video }) => (
    <Card
      className="overflow-hidden hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 cursor-pointer group border-border/50 hover:border-primary/30"
      onClick={() => router.push(`/videos/${video.id}`)}
    >
      <div className="relative aspect-video bg-gradient-to-br from-secondary to-secondary/50 dark:from-primary/15 dark:to-accent/10 flex items-center justify-center overflow-hidden">
        <img 
          src={video.thumbnail} 
          alt={video.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-90 group-hover:scale-110 transition-all duration-300 drop-shadow-lg" />
        </div>
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

        <Button
          className="w-full gap-2 h-9 gradient-primary font-medium text-white"
          variant="default"
          onClick={(event) => {
            event.stopPropagation();
            router.push(`/videos/${video.id}`);
          }}
        >
          <Play className="w-4 h-4" />
          Play
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout title="Watch Videos" requiredRoles={['admin', 'editor', 'viewer']}>
      <PortalPage>
        <PortalHero
          kicker="Viewer Workspace"
          title="Watch Videos"
          actions={
            <>
              <Button className="gap-2" onClick={() => router.push('/videos')}>
                <Play className="h-4 w-4" />
                Open library
              </Button>
              <Button variant="outline" className="bg-transparent" onClick={() => router.push('/bookmarks')}>
                Review bookmarks
              </Button>
            </>
          }
          aside={
            <>
              <div className="rounded-[1.5rem] border border-border/80 bg-background/80 p-5">
                <p className="portal-kicker">Continue watching</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Film className="h-5 w-5" />
                  </div>
                  <p className="font-semibold text-foreground">Recent videos</p>
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-border/80 bg-background/80 p-5">
                <p className="portal-kicker">Featured</p>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-foreground">Highlighted videos</p>
              </div>
            </>
          }
        />

        <section className="space-y-5">
          <PortalSectionHeader
            kicker="New Releases"
            title="Recently added"
            actionLabel="View library"
            onAction={() => router.push('/videos')}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentVideos.slice(0, 4).map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <PortalSectionHeader
            kicker="Editorial Picks"
            title="Featured content"
            actionLabel="Browse all"
            onAction={() => router.push('/videos')}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recentVideos.slice(0, 2).map((video) => (
              <Card
                key={video.id}
                className="overflow-hidden hover:shadow-2xl dark:hover:shadow-2xl transition-all duration-300 cursor-pointer group flex flex-col border-border/50 hover:border-primary/30"
                onClick={() => router.push(`/videos/${video.id}`)}
              >
                <div className="relative aspect-video bg-gradient-to-br from-secondary to-secondary/50 dark:from-primary/15 dark:to-accent/10 flex items-center justify-center overflow-hidden">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Play className="w-16 h-16 text-white opacity-0 group-hover:opacity-90 group-hover:scale-110 transition-all duration-300 drop-shadow-lg" />
                  </div>
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
                    <Button
                      className="flex-1 gap-2 h-10 gradient-primary font-medium text-white"
                      onClick={(event) => {
                        event.stopPropagation();
                        router.push(`/videos/${video.id}`);
                      }}
                    >
                      <Play className="w-4 h-4" />
                      Play Now
                    </Button>
                    <Button variant="outline" size="icon" className="h-10 w-10 bg-transparent">
                      <Bookmark className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

      </PortalPage>
    </DashboardLayout>
  );
}
