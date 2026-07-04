'use client';

import React from 'react';
import { Header } from './Header';
import { ProtectedRoute } from './ProtectedRoute';
import { UserRole } from '@/features/auth/types';
import { GlobalAiDrawer } from './GlobalAiDrawer';
import { useAuth } from '@/features/auth/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  requiredRoles?: UserRole[];
  allowGuests?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title = 'Stream Forge',
  requiredRoles,
  allowGuests = false,
}) => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header title={title} />
      <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
        {allowGuests ? (
          children
        ) : (
          <ProtectedRoute requiredRoles={requiredRoles}>
            {children}
          </ProtectedRoute>
        )}
      </main>
      <GlobalAiDrawer userId={user?.id} />
    </div>
  );
};
