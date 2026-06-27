'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import VideoStatsContent from './VideoStatsContent';

interface VideoStatsModalProps {
  videoId: string;
  videoTitle: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VideoStatsModal({
  videoId,
  videoTitle,
  isOpen,
  onOpenChange,
}: VideoStatsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border border-border sm:max-w-3xl text-left">
        <DialogHeader>
          <DialogTitle className="truncate pr-6 text-base font-bold text-foreground" title={videoTitle}>
            Stats: {videoTitle}
          </DialogTitle>
          <DialogDescription className="font-mono text-[10px] text-muted-foreground mt-0.5">
            Video ID: {videoId}
          </DialogDescription>
        </DialogHeader>
        <div className="pt-2">
          {isOpen && <VideoStatsContent videoId={videoId} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
