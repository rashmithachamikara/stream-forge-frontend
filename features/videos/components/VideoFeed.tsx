'use client';

import React, { useState, useEffect, useRef } from 'react';
import { VideoCard } from './VideoCard';
import { Video, VideoListFilters } from '../types';
import { apiClient } from '@/shared/lib/api';
import { useAuth } from '@/features/auth/AuthContext';
import { VideoCardSkeleton } from './VideoCardSkeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VideoFeedProps {
  filters?: Omit<VideoListFilters, 'page' | 'pageSize'>;
  emptyStateMessage?: string;
}

export function VideoFeed({ filters = {}, emptyStateMessage = 'No videos found.' }: VideoFeedProps) {
  const { isAuthenticated } = useAuth();
  
  // Serialize filters to track deep changes
  const filtersKey = JSON.stringify(filters);
  const [prevFiltersKey, setPrevFiltersKey] = useState(filtersKey);
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const observerTarget = useRef<HTMLDivElement>(null);

  // If filters changed, reset pagination and clear video list
  if (filtersKey !== prevFiltersKey) {
    setPrevFiltersKey(filtersKey);
    setPage(1);
    setVideos([]);
    setHasMore(true);
    setIsLoading(true);
    setError(null);
  }

  useEffect(() => {
    let active = true;

    const fetchVideos = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const queryFilters: VideoListFilters = {
          ...filters,
          page,
          pageSize: 12,
        };

        // Enforce guest access: only public and ready videos if unauthenticated
        if (!isAuthenticated) {
          queryFilters.visibility = 'Public';
          queryFilters.status = 'Ready';
        }

        const response = await apiClient.getVideos(queryFilters);

        if (!active) return;

        if (response.success && response.data) {
          const items = response.data.items;
          setVideos((prev) => (page === 1 ? items : [...prev, ...items]));
          setHasMore(response.data.hasNextPage);
        } else {
          setError(response.error || 'Failed to load videos');
        }
      } catch {
        if (active) {
          setError('An unexpected error occurred while loading videos.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchVideos();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, page, isAuthenticated]);

  // Infinite Scroll Trigger
  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading]);

  return (
    <div className="space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {videos.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <svg
              className="size-6 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">{emptyStateMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            href={`/videos/${video.id}`}
          />
        ))}

        {isLoading &&
          Array.from({ length: page === 1 ? 8 : 4 }).map((_, i) => (
            <VideoCardSkeleton key={`skeleton-${i}`} />
          ))}
      </div>

      {/* Sentinel Element for Infinite Scroll */}
      <div ref={observerTarget} className="h-10 w-full" />
    </div>
  );
}
