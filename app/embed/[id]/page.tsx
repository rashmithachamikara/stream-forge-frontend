import { Suspense } from 'react';
import VideoEmbedPage from '@/features/videos/pages/embed/VideoEmbedPage';

export default async function EmbedVideoRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm text-muted-foreground font-mono bg-black text-white">Loading embed...</div>}>
      <VideoEmbedPage videoId={id} />
    </Suspense>
  );
}
