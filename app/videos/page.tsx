import { Suspense } from 'react';
import VideoLibrary from '@/features/videos/pages/library/VideoLibraryPage';

export default function VideosRoute() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-xs text-muted-foreground">Loading videos...</div>}>
      <VideoLibrary />
    </Suspense>
  );
}

