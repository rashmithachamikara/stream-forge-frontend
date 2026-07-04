import { Suspense } from 'react';
import SettingsPage from '@/features/admin/pages/settings/SettingsPage';

export default function SettingsRoute() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-xs text-muted-foreground font-sans">Loading settings...</div>}>
      <SettingsPage />
    </Suspense>
  );
}
