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
    <header className="bg-card/95 dark:bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50 shadow-sm dark:shadow-md">
      <div className="px-6 py-3 flex items-center justify-between h-16">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
            <span className="text-white text-sm font-bold">SF</span>
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">{title}</h1>
            <p className="text-xs text-muted-foreground capitalize font-medium">
              {user?.role} • {user?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {availableViews.length > 1 && currentView && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 gap-2 bg-transparent">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">{currentView.label}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 bg-card dark:bg-card/95 border-border/50 shadow-xl dark:shadow-2xl backdrop-blur-sm">
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

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="relative hover:bg-secondary rounded-lg h-9 w-9"
          >
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full animate-pulse" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 hover:bg-secondary">
                <InitialsAvatar name={user?.name} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card dark:bg-card/95 border-border/50 shadow-xl dark:shadow-2xl backdrop-blur-sm">
              <div className="px-2 py-2 text-sm">
                <p className="font-semibold text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">Role: {user?.role}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => router.push(user?.role === 'admin' ? '/admin/settings' : '/settings')} 
                className="cursor-pointer"
              >
                <Settings className="w-4 h-4 mr-2" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
