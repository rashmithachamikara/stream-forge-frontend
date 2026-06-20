import { Suspense } from 'react';
import PlaylistsPage from '@/features/playlists/pages/PlaylistsPage';

export default function PlaylistsRoute() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-xs text-muted-foreground">Loading playlists...</div>}>
      <PlaylistsPage />
    </Suspense>
  );
}
