'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import {
  Bell,
  Check,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  Upload,
  X,
} from 'lucide-react';
import { UserRole } from '@/features/auth/types';
import { apiClient } from '@/shared/lib/api';
import { Notification } from '@/features/notifications/types';
import {
  ACTIVE_VIEW_CHANGE_EVENT,
  getAllowedViews,
  resolveActiveView,
  setStoredView,
  VIEW_DASHBOARD_PATHS,
} from '@/shared/lib/viewMode';
import { cn } from '@/shared/lib/utils';

interface HeaderProps {
  title?: string;
}

type NavItem = {
  label: string;
  href: string;
  roles: UserRole[];
  activePatterns?: string[];
};

const navItems: NavItem[] = [
  { label: 'Home', href: '/dashboard', roles: ['admin', 'editor', 'viewer'], activePatterns: ['/dashboard'] },
  { label: 'Videos', href: '/videos', roles: ['admin', 'editor', 'viewer'], activePatterns: ['/videos'] },
  { label: 'Playlists', href: '/playlists', roles: ['admin', 'editor', 'viewer'], activePatterns: ['/playlists'] },
  { label: 'Bookmarks', href: '/bookmarks', roles: ['viewer'], activePatterns: ['/bookmarks'] },
  { label: 'Notifications', href: '/notifications', roles: ['admin', 'editor', 'viewer'], activePatterns: ['/notifications'] },
  { label: 'Analytics', href: '/admin/analytics', roles: ['admin'], activePatterns: ['/admin/analytics'] },
  { label: 'Users', href: '/admin/users', roles: ['admin'], activePatterns: ['/admin/users'] },
  { label: 'Taxonomy', href: '/admin/taxonomy', roles: ['admin'], activePatterns: ['/admin/taxonomy'] },
  { label: 'Settings', href: '/admin/settings', roles: ['admin'], activePatterns: ['/admin/settings'] },
];

const viewOptions: Array<{
  role: UserRole;
  label: string;
}> = [
  { role: 'admin', label: 'Admin' },
  { role: 'editor', label: 'Editor' },
  { role: 'viewer', label: 'Viewer' },
];

const formatRelative = (date: Date): string => {
  const d = date.getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const dd = Math.floor(h / 24);
  if (dd < 30) return `${dd}d ago`;
  return date.toLocaleDateString();
};

const getNotificationTitle = (notification: Notification) => {
  switch (notification.notificationType) {
    case 'Comment':
      return 'New Comment';
    case 'Reply':
      return 'New Reply';
    case 'Like':
      return 'New Reaction';
    case 'ProcessingComplete':
      return 'Processing Complete';
    case 'Upload':
    default:
      return 'Upload Update';
  }
};

export const Header: React.FC<HeaderProps> = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const resolvedView = useMemo(() => (user ? resolveActiveView(user.role, pathname) : null), [pathname, user]);
  const [activeView, setActiveView] = useState<UserRole | null>(resolvedView);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifLoading, setIsNotifLoading] = useState(false);

  const loadHeaderNotifications = useCallback(async () => {
    if (!user) return;
    setIsNotifLoading(true);
    const [notificationsResponse, unreadCountResponse] = await Promise.all([
      apiClient.getNotifications({ page: 1, pageSize: 5 }),
      apiClient.getUnreadNotificationCount(),
    ]);

    if (notificationsResponse.success && notificationsResponse.data) {
      setNotifications(notificationsResponse.data.items);
    }
    if (unreadCountResponse.success && unreadCountResponse.data) {
      setUnreadCount(unreadCountResponse.data.unreadCount);
    }
    setIsNotifLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      const run = async () => {
        await loadHeaderNotifications();
      };

      void run();
    } else {
      queueMicrotask(() => {
        setNotifications([]);
        setUnreadCount(0);
      });
    }
  }, [loadHeaderNotifications, user]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      const response = await apiClient.markNotificationAsRead(notification.id);
      if (response.success) {
        setNotifications((current) =>
          current.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    }
    if (notification.videoId) {
      router.push(`/videos/${notification.videoId}`);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      setActiveView(resolvedView);
    });
  }, [resolvedView]);

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

  useEffect(() => {
    queueMicrotask(() => {
      setMobileOpen(false);
    });
  }, [pathname]);

  const availableViews = useMemo(
    () => (user ? viewOptions.filter((option) => getAllowedViews(user.role).includes(option.role)) : []),
    [user]
  );

  const visibleNavItems = useMemo(() => {
    if (!activeView) {
      return [];
    }

    return navItems
      .filter((item) => item.roles.includes(activeView))
      .map((item) => ({
        ...item,
        href: item.href === '/dashboard' ? VIEW_DASHBOARD_PATHS[activeView] : item.href,
      }));
  }, [activeView]);

  const currentView = viewOptions.find((option) => option.role === activeView);

  const isNavActive = (item: (typeof visibleNavItems)[number]) => {
    const patterns = item.activePatterns ?? [item.href];
    return patterns.some((pattern) => pathname === pattern || pathname.startsWith(`${pattern}/`));
  };

  const canUpload = activeView === 'admin' || activeView === 'editor';

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>

            <Link href={currentView ? VIEW_DASHBOARD_PATHS[currentView.role] : '/dashboard'} className="flex items-center gap-2">
              <div className="grid size-6 place-items-center rounded bg-foreground">
                <div className="size-2.5 rotate-45 bg-background" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold uppercase tracking-tight">Stream Forge</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {canUpload && (
              <Button asChild size="sm" className="hidden sm:inline-flex h-7 text-[11px] px-3">
                <Link href="/videos/upload">
                  <Upload className="size-3.5" />
                  Upload
                </Link>
              </Button>
            )}

            {availableViews.length > 1 && currentView && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" className="capitalize h-7 text-[11px] px-3 flex items-center gap-1">
                    {currentView.label} view
                    <ChevronDown className="size-3 text-muted-foreground ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel>Switch view</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableViews.map((view) => {
                    const isActive = currentView.role === view.role;
                    return (
                      <DropdownMenuItem
                        key={view.role}
                        onClick={() => {
                          setStoredView(view.role);
                          router.push(VIEW_DASHBOARD_PATHS[view.role]);
                        }}
                      >
                        <span className="capitalize">{view.label}</span>
                        {isActive ? <Check className="ml-auto size-3.5" /> : null}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="h-7 w-7 relative cursor-pointer" aria-label="Notifications">
                  <Bell className="size-3.5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 size-1.5 rounded-full bg-primary" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden bg-popover border border-border rounded-md shadow-lg">
                <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Notifications</span>
                  <Link href="/notifications" className="text-[11px] text-primary hover:underline font-semibold cursor-pointer">
                    View all
                  </Link>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-border">
                  {isNotifLoading ? (
                    <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                      Loading notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((n) => {
                      return (
                        <div
                          key={n.id}
                          onClick={() => void handleNotificationClick(n)}
                          className={cn(
                            "px-3 py-2.5 hover:bg-accent/40 transition-colors cursor-pointer text-left flex items-start gap-2",
                            !n.isRead && "bg-primary/[0.01]"
                          )}
                        >
                          {!n.isRead && (
                            <span className="mt-1.5 size-1.5 bg-primary rounded-full shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-foreground truncate">{getNotificationTitle(n)}</p>
                            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                            <span className="text-[9px] font-mono text-muted-foreground mt-1 block">
                              {formatRelative(n.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-7 w-7 rounded-full p-0" aria-label="Account menu">
                  <InitialsAvatar name={user?.name} className="h-7 w-7" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="space-y-0.5">
                  <p className="text-xs font-semibold text-foreground">{user?.name}</p>
                  <p className="truncate text-[11px] font-normal text-muted-foreground">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/admin/settings')}>
                  <Settings className="size-3.5" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                  <LogOut className="size-3.5" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <nav className="hidden gap-1 overflow-x-auto -mb-px md:flex" aria-label="Primary">
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex h-10 items-center whitespace-nowrap border-b-2 px-3 text-[13px] font-medium transition-colors duration-150',
                isNavActive(item)
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto max-w-[1600px] space-y-1 px-4 py-3 sm:px-6">
            {canUpload && (
              <Button asChild size="sm" className="mb-2 w-full justify-center h-7 text-[11px]">
                <Link href="/videos/upload">
                  <Upload className="size-3.5" />
                  Upload
                </Link>
              </Button>
            )}
            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'block rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150',
                  isNavActive(item) ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
