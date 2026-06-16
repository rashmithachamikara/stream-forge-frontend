'use client';

import React from 'react';
import { Header } from './Header';
import { ProtectedRoute } from './ProtectedRoute';
import { UserRole } from '@/features/auth/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  requiredRoles?: UserRole[];
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title = 'Stream Forge',
  requiredRoles,
}) => {
  return (
    <ProtectedRoute requiredRoles={requiredRoles}>
      <div className="min-h-screen bg-background text-foreground">
        <Header title={title} />
        <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">{children}</main>
      </div>
    </ProtectedRoute>
  );
};
