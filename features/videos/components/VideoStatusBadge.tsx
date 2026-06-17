'use client';

import React from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { VideoStatus } from '@/features/videos/types';
import { capitalize } from '@/shared/lib/utils';
import { cn } from '@/shared/lib/utils';

const STATUS_CLASS_MAP: Record<VideoStatus, string> = {
  Ready: 'border-success/20 bg-success/10 text-success',
  Processing: 'border-primary/20 bg-primary/10 text-primary',
  Uploading: 'border-primary/20 bg-primary/10 text-primary',
  Failed: 'border-destructive/20 bg-destructive/10 text-destructive',
  Deleted: 'border-border bg-muted text-muted-foreground',
};

const STATUS_ICON_MAP: Record<VideoStatus, React.ComponentType<{ className?: string }>> = {
  Ready: CheckCircle,
  Processing: Loader2,
  Uploading: Loader2,
  Failed: AlertCircle,
  Deleted: AlertCircle,
};

type VideoStatusBadgeProps = {
  status: VideoStatus;
  className?: string;
};

export function VideoStatusBadge({ status, className }: VideoStatusBadgeProps) {
  const Icon = STATUS_ICON_MAP[status];

  return (
    <Badge className={cn('gap-1.5', STATUS_CLASS_MAP[status], className)}>
      <Icon className={cn('size-3', (status === 'Processing' || status === 'Uploading') && 'animate-spin')} />
      {capitalize(status)}
    </Badge>
  );
}
