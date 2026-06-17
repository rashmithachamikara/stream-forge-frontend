'use client';

import React from 'react';
import { Globe, Lock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { VideoVisibility } from '@/features/videos/types';
import { capitalize } from '@/shared/lib/utils';
import { cn } from '@/shared/lib/utils';

const VISIBILITY_CLASS_MAP: Record<VideoVisibility, string> = {
  public: 'border-success/20 bg-success/10 text-success',
  private: 'border-border bg-muted text-muted-foreground',
  internal: 'border-warning/20 bg-warning/10 text-warning-foreground',
  restricted: 'border-warning/20 bg-warning/10 text-warning-foreground',
};

const VISIBILITY_ICON_MAP: Record<VideoVisibility, React.ComponentType<{ className?: string }>> = {
  public: Globe,
  private: Lock,
  internal: Users,
  restricted: Users,
};

type VideoVisibilityBadgeProps = {
  visibility: VideoVisibility;
  className?: string;
};

export function VideoVisibilityBadge({ visibility, className }: VideoVisibilityBadgeProps) {
  const Icon = VISIBILITY_ICON_MAP[visibility];

  return (
    <Badge className={cn('gap-1.5', VISIBILITY_CLASS_MAP[visibility], className)}>
      <Icon className="size-3" />
      {capitalize(visibility)}
    </Badge>
  );
}
