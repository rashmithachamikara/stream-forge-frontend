import { Suspense } from 'react';
import EditorAnalyticsDashboard from '@/features/dashboard/pages/editor/EditorAnalyticsPage';

export default function EditorAnalyticsRoute() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-xs text-muted-foreground">Loading analytics...</div>}>
      <EditorAnalyticsDashboard />
    </Suspense>
  );
}
