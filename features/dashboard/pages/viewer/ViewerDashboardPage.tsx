'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, Play } from 'lucide-react';
import { mockVideos } from '@/features/videos/data/mockVideos';
import { Video } from '@/features/videos/types';
import { VideoCard } from '@/features/videos/components/VideoCard';

export default function ViewerDashboard() {
  const router = useRouter();
  const [videos] = useState<Video[]>(mockVideos);

  const recentVideos = [...videos].sort(
    (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()
  );

  return (
    <DashboardLayout title="Watch Videos" requiredRoles={['admin', 'editor', 'viewer']}>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Viewer dashboard</p>
            <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
            <CardDescription>Continue watching recent uploads and browse featured content.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button className="gap-2" variant="default">
                <Play className="w-4 h-4" />
                Continue Watching
              </Button>
              <Button variant="secondary">
                Saved for Later
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recently Added Section */}
        <div>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Recently added</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Latest uploads</h2>
            </div>
            <Button variant="outline">View All</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentVideos.slice(0, 4).map((video) => (
              <VideoCard key={video.id} video={video} onClick={() => router.push(`/videos/${video.id}`)} />
            ))}
          </div>
        </div>

        {/* Featured Section */}
        <div>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Featured content</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Recommended videos</h2>
            </div>
            <Button variant="outline">View All</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recentVideos.slice(0, 2).map((video) => (
              <div key={video.id} className="space-y-3">
                <VideoCard video={video} variant="feature" onClick={() => router.push(`/videos/${video.id}`)} />
                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-2 h-10"
                    onClick={() => router.push(`/videos/${video.id}`)}
                  >
                    <Play className="w-4 h-4" />
                    Play Now
                  </Button>
                  <Button variant="outline" size="icon" className="h-10 w-10">
                    <Bookmark className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
