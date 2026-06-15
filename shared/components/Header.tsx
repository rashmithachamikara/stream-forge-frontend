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
import { LogOut, Settings, Bell, Eye, PencilLine, Shield, LayoutDashboard } from 'lucide-react';
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
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/88 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] w-full max-w-[1480px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl gradient-primary shadow-[0_14px_30px_hsl(var(--primary)/0.22)]">
            <span className="text-sm font-semibold tracking-[0.18em] text-white">SF</span>
          </div>
          <div className="min-w-0">
            <p className="portal-kicker">Stream Forge Portal</p>
            <h1 className="truncate text-lg font-semibold tracking-[-0.03em] text-foreground">{title}</h1>
            <p className="truncate text-xs text-muted-foreground capitalize">
              {user?.role} • {user?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {availableViews.length > 1 && currentView ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="hidden h-10 gap-2 bg-background/90 sm:inline-flex">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>{currentView.label} view</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 border-border/70 bg-card/98 shadow-xl backdrop-blur-xl">
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
                      className="cursor-pointer rounded-lg"
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{view.label}</span>
                      {isActive ? <span className="ml-auto text-xs text-muted-foreground">Current</span> : null}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="relative h-10 w-10 rounded-2xl hover:bg-secondary"
          >
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-2xl p-0 hover:bg-secondary">
                <InitialsAvatar name={user?.name} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 border-border/70 bg-card/98 shadow-xl backdrop-blur-xl">
              <div className="px-2 py-2 text-sm">
                <p className="font-semibold text-foreground">{user?.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                <p className="mt-1 text-xs text-muted-foreground capitalize">Role: {user?.role}</p>
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
