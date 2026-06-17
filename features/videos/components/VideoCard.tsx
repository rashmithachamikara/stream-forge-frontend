'use client';

import React from 'react';
import { Play } from 'lucide-react';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import { cn } from '@/shared/lib/utils';
import { Video } from '@/features/videos/types';
import { VideoVisibilityBadge } from './VideoVisibilityBadge';
import { VideoStatusBadge } from './VideoStatusBadge';

type VideoCardProps = {
  video: Video;
  variant?: 'grid' | 'feature' | 'compact';
  className?: string;
  onClick?: () => void;
};

const formatRelativeDate = (date: Date) => {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  return date.toLocaleDateString();
};

const formatViews = (views: number) => {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}k`;
  return String(views);
};

const formatPlaybackDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return `${minutes}:${String(secs).padStart(2, '0')}`;
};

export function VideoCard({ video, variant = 'grid', className, onClick }: VideoCardProps) {
  const isFeature = variant === 'feature';
  const isCompact = variant === 'compact';

  return (
    <article
      className={cn(
        'group',
        onClick && 'cursor-pointer',
        isCompact && 'flex items-start gap-3',
        className
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          'relative overflow-hidden bg-muted ring-1 ring-border',
          isCompact ? 'aspect-video w-32 shrink-0 rounded-lg' : 'aspect-video rounded-lg',
          isFeature && 'aspect-[16/9]'
        )}
      >
        <img
          src={video.thumbnail}
          alt={video.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <div className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition-all duration-150 group-hover:bg-black/30 group-hover:opacity-100">
          <div className="grid size-12 place-items-center rounded-full bg-background/95">
            <Play className="ml-0.5 size-5 fill-foreground text-foreground" />
          </div>
        </div>
        <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[10px] text-white">
          {formatPlaybackDuration(video.duration)}
        </span>
        {video.status && video.status !== 'Ready' && (
          <span className="absolute left-2 top-2 rounded border border-border bg-background/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-foreground">
            {video.status}
          </span>
        )}
      </div>

      <div className={cn('min-w-0', isCompact ? 'flex-1 pt-0.5' : 'mt-4 flex gap-3')}>
        {!isCompact && <InitialsAvatar name={video.uploadedBy} className="h-8 w-8 shrink-0" />}
        {isCompact && <InitialsAvatar name={video.uploadedBy} className="h-8 w-8 shrink-0" />}

        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              'line-clamp-2 font-semibold leading-snug text-foreground transition-colors group-hover:text-primary',
              isFeature ? 'text-base' : 'text-sm md:text-[15px]'
            )}
          >
            {video.title}
          </h3>

          <p className="mt-1.5 truncate text-[11px] text-muted-foreground md:text-xs">
            {video.uploadedBy} · {formatViews(video.views)} views · {formatRelativeDate(video.uploadedAt)}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <VideoVisibilityBadge visibility={video.visibility} showIcon={false} />
            {video.status && video.status !== 'Ready' ? <VideoStatusBadge status={video.status} /> : null}
            {video.categories.slice(0, 1).map((category) => (
              <span key={category} className="text-[11px] text-muted-foreground">
                {category}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
