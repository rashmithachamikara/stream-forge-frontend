'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Eye, Clock, Bookmark } from 'lucide-react';
import { mockVideos } from '@/features/videos/data/mockVideos';
import { Video } from '@/features/videos/types';
import { formatDuration } from '@/features/videos/utils';
import { PageHeader, SectionHeader, VideoTile } from '@/shared/components/AppChrome';

export default function ViewerDashboard() {
  const router = useRouter();
  const [videos] = useState<Video[]>(mockVideos);

  const recentVideos = [...videos].sort(
    (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()
  );


  const VideoCard = ({ video }: { video: Video }) => (
    <VideoTile
      title={video.title}
      description={video.description}
      thumbnail={video.thumbnail}
      onClick={() => router.push(`/videos/${video.id}`)}
      meta={
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {video.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {video.views}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {video.uploadedAt.toLocaleDateString()}
            </span>
          </div>
        </div>
      }
      action={
        <Button
          className="h-9 w-full gap-2"
          onClick={() => {
            router.push(`/videos/${video.id}`);
          }}
        >
          <Play className="h-4 w-4" />
          Play
        </Button>
      }
    />
  );

  return (
    <DashboardLayout title="Watch Videos" requiredRoles={['admin', 'editor', 'viewer']}>
      <div className="space-y-8">
        <PageHeader
          title="Watch Videos"
          description="Resume training, demos, and team updates from the shared library."
        />
        {/* Welcome Card */}
        <Card className="relative overflow-hidden border-primary/20 bg-primary/10 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" />
          <CardHeader className="relative z-10">
            <CardTitle className="text-2xl text-foreground">Welcome back</CardTitle>
            <CardDescription>Continue watching your videos and explore new content.</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex flex-wrap gap-2">
              <Button className="gap-2" variant="default">
                <Play className="w-4 h-4" />
                Continue Watching
              </Button>
              <Button variant="outline" className="bg-secondary/40">
                Saved for Later
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recently Added Section */}
        <div>
          <SectionHeader
            title="Recently added"
            description="Latest videos from your organization."
            action={<Button variant="outline">View all</Button>}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentVideos.slice(0, 4).map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </div>

        {/* Featured Section */}
        <div>
          <SectionHeader
            title="Featured content"
            description="Handpicked videos for the current view."
            action={<Button variant="outline">View all</Button>}
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
