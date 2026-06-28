'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play } from 'lucide-react';
import { VideoFeed } from '@/features/videos/components/VideoFeed';
import { AuthenticatedThumbnail } from '@/shared/components/AuthenticatedThumbnail';
import { apiClient } from '@/shared/lib/api';
import { Video, Category } from '@/features/videos/types';
import { cn } from '@/shared/lib/utils';

export default function ExploreVideosPage() {
  const [heroVideo, setHeroVideo] = useState<Video | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    let active = true;

    const fetchInitialData = async () => {
      try {
        const [catsRes, heroRes] = await Promise.all([
          apiClient.getCategories(),
          apiClient.getVideos({ sort: 'recentlyCreated', pageSize: 1, status: 'Ready' }),
        ]);

        if (!active) return;

        if (catsRes.success && catsRes.data) {
          setCategories(catsRes.data);
        }
        if (heroRes.success && heroRes.data && heroRes.data.items.length > 0) {
          setHeroVideo(heroRes.data.items[0]);
        }
      } catch (error) {
        console.error('Failed to load initial explore page data:', error);
      }
    };

    fetchInitialData();

    return () => {
      active = false;
    };
  }, []);

  const feedFilters = {
    categoryId: selectedCategoryId,
    search: searchQuery || undefined,
    status: 'Ready' as const,
  };

  return (
    <DashboardLayout title="Explore Videos" allowGuests={true}>
      <div className="space-y-8">
        {/* Page header */}
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
            Explore
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Public Videos</h1>
        </div>

        {/* Hero Section */}
        {heroVideo && (
          <div className="relative aspect-[21/9] w-full overflow-hidden rounded-xl border border-border bg-muted">
            <AuthenticatedThumbnail
              src={heroVideo.thumbnail}
              alt={heroVideo.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 flex flex-col justify-end h-full text-foreground">
              <div className="max-w-2xl space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-primary/10 text-primary border border-primary/20 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    Featured
                  </span>
                  {heroVideo.categories.length > 0 && (
                    <span className="bg-secondary text-secondary-foreground rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-border">
                      {heroVideo.categories[0]}
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight line-clamp-2" title={heroVideo.title}>
                  {heroVideo.title}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 max-w-xl">
                  {heroVideo.description}
                </p>
                <div className="pt-2">
                  <Button asChild className="bg-foreground text-background hover:opacity-90 gap-2 text-xs font-semibold py-1.5 px-3">
                    <Link href={`/videos/${heroVideo.id}`}>
                      <Play className="size-3.5 fill-current" />
                      Watch now
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Browse Categories */}
        {categories.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Browse Categories
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategoryId(undefined)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer',
                  selectedCategoryId === undefined
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-card text-foreground border-border hover:border-foreground/20'
                )}
              >
                All Videos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(selectedCategoryId === cat.id ? undefined : cat.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer',
                    selectedCategoryId === cat.id
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-card text-foreground border-border hover:border-foreground/20'
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Video Feed Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Explore Videos
            </h2>
            <div className="w-full sm:w-72">
              <Input
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-muted border-0 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <VideoFeed
            filters={feedFilters}
            emptyStateMessage="No public videos found on this channel."
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
