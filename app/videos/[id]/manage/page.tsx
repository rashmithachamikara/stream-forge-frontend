import VideoManagePage from '@/features/videos/pages/manage/VideoManagePage';

export default async function ManageVideoRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <VideoManagePage videoId={id} />;
}
