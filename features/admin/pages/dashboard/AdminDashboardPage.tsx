'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { PortalHero, PortalPage, PortalSectionHeader, PortalStatCard, PortalStatGrid } from '@/shared/components/portal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Video, Eye, TrendingUp, ArrowRight, ShieldCheck, SlidersHorizontal } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();

  const stats = [
    { label: 'Total Users', value: '124', icon: Users, change: '+12%' },
    { label: 'Total Videos', value: '456', icon: Video, change: '+8%' },
    { label: 'Total Views', value: '45.2K', icon: Eye, change: '+23%' },
    { label: 'Avg Watch Time', value: '8m 32s', icon: TrendingUp, change: '+5%' },
  ];

  return (
    <DashboardLayout title="Admin Dashboard" requiredRoles={['admin']}>
      <PortalPage>
        <PortalHero
          kicker="Operations Overview"
          title="Admin Dashboard"
          actions={
            <>
              <Button onClick={() => router.push('/admin/users')}>Open user management</Button>
              <Button variant="outline" className="bg-transparent" onClick={() => router.push('/admin/analytics')}>
                Review analytics
              </Button>
            </>
          }
          aside={
            <>
              <div className="rounded-[1.5rem] border border-border/80 bg-background/80 p-5">
                <p className="portal-kicker">Security posture</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <p className="text-base font-semibold text-foreground">Role-based access active</p>
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-border/80 bg-background/80 p-5">
                <p className="portal-kicker">Focus</p>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-foreground">Users and taxonomy</p>
              </div>
            </>
          }
        />

        <PortalStatGrid>
          {stats.map((stat, index) => {
            return (
              <PortalStatCard
                key={index}
                label={stat.label}
                value={stat.value}
                detail={`${stat.change} from last month`}
                icon={stat.icon}
              />
            );
          })}
        </PortalStatGrid>

        <PortalSectionHeader
          kicker="Administrative Workflows"
          title="Administrative workflows"
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle>Users</CardTitle>
                <CardDescription>Review members, active status, and access levels across the organization.</CardDescription>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="gap-2 bg-transparent" onClick={() => router.push('/admin/users')}>
                View users
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle>Taxonomy</CardTitle>
                <CardDescription>Standardize categories and tags so discovery and analytics stay meaningful.</CardDescription>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="gap-2 bg-transparent" onClick={() => router.push('/admin/taxonomy')}>
                Open taxonomy
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </PortalPage>
    </DashboardLayout>
  );
}
