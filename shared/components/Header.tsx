'use client';

import React, { useEffect, useMemo, useState } from 'react';
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

export const Header: React.FC<HeaderProps> = ({ title = 'Stream Forge' }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeView, setActiveView] = useState<UserRole | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  useEffect(() => {
    setMobileOpen(false);
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
              {mounted && theme === 'dark' ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            </Button>

            <Button variant="ghost" size="icon-sm" className="h-7 w-7" asChild aria-label="Notifications">
              <Link href="/notifications" className="relative">
                <Bell className="size-3.5" />
                <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />
              </Link>
            </Button>

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
