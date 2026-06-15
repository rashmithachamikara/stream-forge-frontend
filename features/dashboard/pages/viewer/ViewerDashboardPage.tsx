'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { PortalHero, PortalPage, PortalSectionHeader } from '@/shared/components/portal';
import { Button } from '@/components/ui/button';
import { Play, Bookmark, Film } from 'lucide-react';
import { mockVideos } from '@/features/videos/data/mockVideos';
import { VideoPreviewCard } from '@/features/videos/components/VideoPreviewCard';
import { Video } from '@/features/videos/types';

export default function ViewerDashboard() {
  const router = useRouter();
  const [videos] = useState<Video[]>(mockVideos);

  const recentVideos = [...videos].sort(
    (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()
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
              <VideoPreviewCard key={video.id} video={video} onOpen={(videoId) => router.push(`/videos/${videoId}`)} compact />
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
              <div key={video.id} className="relative">
                <VideoPreviewCard video={video} onOpen={(videoId) => router.push(`/videos/${videoId}`)} />
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute bottom-7 right-7 z-10 h-11 w-11 rounded-xl bg-background/92"
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>

      </PortalPage>
    </DashboardLayout>
  );
}
