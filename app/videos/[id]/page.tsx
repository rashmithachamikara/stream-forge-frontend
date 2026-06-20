import { Suspense } from 'react';
import VideoDetailPage from '@/features/videos/pages/detail/VideoDetailPage';

export default async function WatchVideoRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm text-muted-foreground">Loading video...</div>}>
      <VideoDetailPage videoId={id} />
    </Suspense>
  );
}
