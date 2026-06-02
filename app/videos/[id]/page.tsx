import VideoDetailPage from '@/features/videos/pages/detail/VideoDetailPage';

export default async function WatchVideoRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <VideoDetailPage videoId={id} />;
}
