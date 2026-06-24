'use client';

import React from 'react';

export function VideoCardSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {/* 16:9 Aspect Video Skeleton */}
      <div className="aspect-video w-full rounded-lg bg-muted" />

      {/* Metadata Row Skeleton */}
      <div className="flex gap-3">
        {/* Avatar Skeleton */}
        <div className="size-8 rounded-full bg-muted shrink-0" />

        {/* Text Skeletons */}
        <div className="flex-1 space-y-2">
          {/* Title Line 1 */}
          <div className="h-4 w-5/6 rounded bg-muted" />
          {/* Title Line 2 */}
          <div className="h-3 w-2/3 rounded bg-muted" />
          {/* Meta line (uploader / views / date) */}
          <div className="h-3.5 w-1/2 rounded bg-muted mt-3" />
        </div>
      </div>
    </div>
  );
}
