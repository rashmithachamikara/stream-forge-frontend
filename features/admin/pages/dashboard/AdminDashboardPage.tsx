'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Video, Eye, TrendingUp, ArrowRight } from 'lucide-react';
import { PageHeader, StatTile } from '@/shared/components/AppChrome';

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
      <div className="space-y-8">
        <PageHeader
          title="Admin Dashboard"
          description="Monitor users, video volume, and viewing activity from the operator console."
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <StatTile
                key={index}
                label={stat.label}
                value={stat.value}
                icon={Icon}
                helper={<><span className="font-semibold text-primary">{stat.change}</span> from last month</>}
              />
            );
          })}
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Users</CardTitle>
              <CardDescription>Browse and filter system users.</CardDescription>
            </div>
            <Button variant="outline" className="gap-2" onClick={() => router.push('/admin/users')}>
              View users
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
        </Card>
      </div>
    </DashboardLayout>
  );
}
