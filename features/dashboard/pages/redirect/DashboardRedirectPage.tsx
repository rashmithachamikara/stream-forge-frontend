'use client';

import { useAuth } from '@/features/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardLayout } from '@/shared/components/DashboardLayout';

export default function Dashboard() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push(`/dashboard/${user.role}`);
      } else {
        router.push('/');
      }
    }
  }, [user, isLoading, router]);

  return (
    <DashboardLayout title="Loading Dashboard" allowGuests={true}>
      <div className="space-y-8">
        {/* Pulsing Page Header */}
        <div className="animate-pulse space-y-1.5">
          <div className="h-3 bg-muted/60 rounded w-16" />
          <div className="h-7 bg-muted/60 rounded w-48" />
        </div>

        {/* Pulsing KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted/40 rounded-md border border-border/40 animate-pulse" />
          ))}
        </div>

        {/* Pulsing Video grid */}
        <div className="space-y-4">
          <div className="h-3 bg-muted/60 rounded w-24 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3 animate-pulse">
                <div className="aspect-video rounded-lg bg-muted/40 ring-1 ring-border/10" />
                <div className="flex gap-2">
                  <div className="size-8 rounded-full bg-muted/40" />
                  <div className="flex-1 space-y-1.5 pt-1">
                    <div className="h-3.5 bg-muted/40 rounded w-5/6" />
                    <div className="h-3 bg-muted/40 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
