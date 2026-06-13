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
      <div className="flex min-h-[100dvh] flex-col overflow-x-hidden bg-background text-foreground">
        <Header title={title} />
        <div className="flex flex-1">
          <Sidebar />
          <main id="main-content" className="min-w-0 flex-1">
            <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};
