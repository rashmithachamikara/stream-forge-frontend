'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import { ThemeModeToggle } from '@/shared/components/ThemeModeToggle';
import { Bell, Eye, LayoutDashboard, LogOut, PencilLine, Search, Settings, Shield } from 'lucide-react';
import { UserRole } from '@/features/auth/types';
import {
  ACTIVE_VIEW_CHANGE_EVENT,
  getAllowedViews,
  resolveActiveView,
  setStoredView,
  VIEW_DASHBOARD_PATHS,
} from '@/shared/lib/viewMode';

interface HeaderProps {
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ title = 'Stream Forge' }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [activeView, setActiveView] = useState<UserRole | null>(null);

  const viewOptions: Array<{
    role: UserRole;
    label: string;
    href: string;
    icon: typeof Shield;
  }> = [
    { role: 'admin', label: 'Admin', href: '/dashboard/admin', icon: Shield },
    { role: 'editor', label: 'Editor', href: '/dashboard/editor', icon: PencilLine },
    { role: 'viewer', label: 'Viewer', href: '/dashboard/viewer', icon: Eye },
  ];

  useEffect(() => {
    if (!user) {
      setActiveView(null);
      return;
    }

    setActiveView(resolveActiveView(user.role, pathname));
  }, [pathname, user]);

  useEffect(() => {
    const handleViewChange = (event: Event) => {
      const nextView = (event as CustomEvent<UserRole>).detail;
      if (user && getAllowedViews(user.role).includes(nextView)) {
        setActiveView(nextView);
      }
    };

    window.addEventListener(ACTIVE_VIEW_CHANGE_EVENT, handleViewChange);
    return () => window.removeEventListener(ACTIVE_VIEW_CHANGE_EVENT, handleViewChange);
  }, [user]);

  const availableViews = useMemo(
    () => (user ? viewOptions.filter((option) => getAllowedViews(user.role).includes(option.role)) : []),
    [user]
  );
  const currentView = viewOptions.find((option) => option.role === activeView);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header
      data-app-header
      className="sticky top-0 z-50 border-b border-border/70 bg-background/78 shadow-[0_16px_50px_rgba(0,0,0,0.26)] backdrop-blur-xl"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="gradient-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-primary/30 shadow-[0_14px_36px_color-mix(in_oklch,var(--primary)_26%,transparent)]">
            <span className="text-sm font-black tracking-[-0.04em] text-primary-foreground">SF</span>
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold tracking-[-0.02em] text-foreground sm:text-base">{title}</h1>
            <p className="truncate text-xs font-medium capitalize text-muted-foreground">
              {user?.role} / {user?.name}
            </p>
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 justify-center px-4 md:flex">
          <div className="flex h-9 w-full max-w-md items-center gap-2 rounded-lg border border-border/70 bg-input/60 px-3 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            <span className="truncate">Search videos, playlists, users</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {availableViews.length > 1 && currentView && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 gap-2 bg-secondary/40">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">{currentView.label}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="media-surface w-44 border-border/80 shadow-xl">
                {availableViews.map((view) => {
                  const Icon = view.icon;
                  const isActive = currentView.role === view.role;

                  return (
                    <DropdownMenuItem
                      key={view.role}
                      onClick={() => {
                        setStoredView(view.role);
                        router.push(VIEW_DASHBOARD_PATHS[view.role]);
                      }}
                      className="cursor-pointer"
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{view.label}</span>
                      {isActive && <span className="ml-auto text-xs text-muted-foreground">Current</span>}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <ThemeModeToggle />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="relative h-9 w-9 rounded-lg hover:bg-secondary"
            aria-pressed={notificationOpen}
          >
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary shadow-[0_0_16px_var(--primary)]" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 hover:bg-secondary">
                <InitialsAvatar name={user?.name} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="media-surface w-56 border-border/80 shadow-xl">
              <div className="px-2 py-2 text-sm">
                <p className="font-semibold text-foreground">{user?.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                <p className="mt-1 text-xs capitalize text-muted-foreground">Role: {user?.role}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push(user?.role === 'admin' ? '/admin/settings' : '/settings')}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
