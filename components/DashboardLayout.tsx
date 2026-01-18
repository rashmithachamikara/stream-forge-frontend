'use client';

import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ProtectedRoute } from './ProtectedRoute';
import { UserRole } from '@/types';

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
      <div className="flex h-screen flex-col bg-background">
        <Header title={title} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="p-6 lg:p-8">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};
