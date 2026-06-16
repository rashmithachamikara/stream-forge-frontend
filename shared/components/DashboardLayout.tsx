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
      <div className="flex min-h-dvh flex-col bg-background text-foreground">
        <Header title={title} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main id="main-content" className="w-full max-w-full flex-1 overflow-x-hidden overflow-y-auto">
            <div className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};
