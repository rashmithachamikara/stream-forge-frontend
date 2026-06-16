'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Video, Eye, TrendingUp, ArrowRight } from 'lucide-react';

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
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.035em] text-foreground md:text-4xl">Admin overview</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Monitor platform activity, user access, and video performance from one operational view.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="transition-transform duration-300 hover:-translate-y-0.5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                  <Icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold tracking-[-0.03em]">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-chart-3">{stat.change}</span> from last month
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Users</CardTitle>
              <CardDescription>Browse and filter system users.</CardDescription>
            </div>
            <Button variant="outline" className="gap-2 bg-background/70" onClick={() => router.push('/admin/users')}>
              View users
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
        </Card>
      </div>
    </DashboardLayout>
  );
}
