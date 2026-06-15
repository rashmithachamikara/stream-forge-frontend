'use client';

import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
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
      <div className="portal-shell flex min-h-[100dvh] flex-col bg-transparent">
        <Header title={title} />
        <div className="flex flex-1">
          <Sidebar />
          <main id="portal-main" className="min-w-0 flex-1">
            <div className="px-4 pb-8 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-6">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};
