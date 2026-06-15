'use client';

import React from 'react';
import { Eye, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video } from '@/features/videos/types';
import { formatDuration } from '@/features/videos/utils';
import { capitalize, cn } from '@/shared/lib/utils';

interface VideoPreviewCardProps {
  video: Video;
  onOpen: (videoId: string) => void;
  className?: string;
  compact?: boolean;
  showDescription?: boolean;
}

export function VideoPreviewCard({
  video,
  onOpen,
  className,
  compact = false,
  showDescription = true,
}: VideoPreviewCardProps) {
  const eyebrow = video.categories[0] ?? video.tags[0] ?? 'Video';

  return (
    <Card
      className={cn(
        'group h-full cursor-pointer overflow-hidden rounded-[1.9rem] border-0 gap-0 py-0 bg-[linear-gradient(180deg,#ffffff_0%,#fbfbfd_100%)] shadow-[0_22px_50px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_60px_rgba(15,23,42,0.12)]',
        className
      )}
      onClick={() => onOpen(video.id)}
    >
      <div className="relative overflow-hidden rounded-t-[1.9rem]">
        <div className="absolute left-4 top-4 z-10 rounded-lg bg-[hsl(var(--primary))] px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-white shadow-[0_8px_18px_hsl(var(--primary)/0.28)]">
          {capitalize(video.visibility)}
        </div>
        <img
          src={video.thumbnail}
          alt={video.title}
          className={cn(
            'h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]',
            compact ? 'aspect-[16/10]' : 'aspect-[16/10]'
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/18 via-transparent to-black/8" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm">
            <Play className="ml-0.5 h-6 w-6" />
          </div>
        </div>
        <div className="absolute bottom-4 right-4 rounded-xl bg-slate-950/88 px-3 py-1.5 text-sm font-semibold text-white">
          {formatDuration(video.duration)}
        </div>
      </div>

      <CardContent className={cn('flex flex-1 flex-col', compact ? 'p-5' : 'p-6')}>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
        <h3 className={cn('line-clamp-2 font-semibold tracking-[-0.03em] text-foreground', compact ? 'mb-2 text-base leading-snug' : 'mb-3 text-[1.35rem] leading-snug')}>
          {video.title}
        </h3>
        {showDescription ? (
          <p className={cn('line-clamp-2 text-muted-foreground', compact ? 'mb-4 text-sm leading-6' : 'mb-5 text-sm leading-7')}>
            {video.description}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between border-t border-border/70 pt-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            {video.views.toLocaleString()} watched
          </span>
          <span>{video.uploadedAt.toLocaleDateString()}</span>
        </div>

        {!compact ? (
          <Button
            className="mt-5 w-full gap-2"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation();
              onOpen(video.id);
            }}
          >
            <Play className="h-4 w-4" />
            Open video
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
