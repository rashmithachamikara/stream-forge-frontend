'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';
import { cn } from '@/shared/lib/utils';
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Bookmark,
  List,
  Tags,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/features/auth/types';
import {
  ACTIVE_VIEW_CHANGE_EVENT,
  resolveActiveView,
  setStoredView,
  VIEW_DASHBOARD_PATHS,
} from '@/shared/lib/viewMode';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'editor', 'viewer'],
  },
  {
    label: 'Videos',
    href: '/videos',
    icon: FileText,
    roles: ['admin', 'editor', 'viewer'],
  },
  {
    label: 'Playlists',
    href: '/playlists',
    icon: List,
    roles: ['admin', 'editor', 'viewer'],
  },
  {
    label: 'Bookmarks',
    href: '/bookmarks',
    icon: Bookmark,
    roles: ['viewer'],
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: Users,
    roles: ['admin'],
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    roles: ['admin'],
  },
  {
    label: 'Taxonomy',
    href: '/admin/taxonomy',
    icon: Tags,
    roles: ['admin'],
  },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<UserRole | null>(null);

  useEffect(() => {
    if (!user) {
      setActiveView(null);
      return;
    }

    const nextView = resolveActiveView(user.role, pathname);
    setActiveView(nextView);
    setStoredView(nextView);
  }, [pathname, user]);

  useEffect(() => {
    const handleViewChange = (event: Event) => {
      setActiveView((event as CustomEvent<UserRole>).detail);
    };

    window.addEventListener(ACTIVE_VIEW_CHANGE_EVENT, handleViewChange);
    return () => window.removeEventListener(ACTIVE_VIEW_CHANGE_EVENT, handleViewChange);
  }, []);

  const filteredItems = navItems.filter((item) => activeView && item.roles.includes(activeView));

  const NavContent = () => (
    <>
      <div className="border-b border-sidebar-border/80 px-4 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/55">Navigation</p>
      </div>
      <nav className="flex-1 space-y-1.5 px-3 py-4">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const href = item.href === '/dashboard' && activeView ? VIEW_DASHBOARD_PATHS[activeView] : item.href;
          const isActive =
            pathname === href ||
            pathname.startsWith(`${href}/`) ||
            (item.href === '/dashboard' && pathname.startsWith('/dashboard'));

          return (
            <Link key={item.href} href={href} onClick={() => setIsOpen(false)}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'h-11 w-full justify-start gap-3 rounded-2xl px-3.5 font-medium transition-all',
                  isActive
                    ? 'gradient-primary text-white shadow-[0_14px_28px_hsl(var(--primary)/0.24)]'
                    : 'text-sidebar-foreground/78 hover:bg-sidebar-accent hover:text-sidebar-foreground dark:hover:bg-sidebar-accent'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-[18px] z-40 rounded-2xl border border-border/70 bg-background/90 hover:bg-secondary lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <aside className="sticky top-[76px] hidden h-[calc(100dvh-76px)] w-[286px] flex-col border-r border-sidebar-border/80 bg-sidebar text-sidebar-foreground lg:flex">
        <NavContent />
      </aside>

      {isOpen ? (
        <>
          <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setIsOpen(false)} />
          <aside className="fixed left-0 top-[76px] z-40 h-[calc(100dvh-76px)] w-[286px] overflow-y-auto border-r border-sidebar-border/80 bg-sidebar text-sidebar-foreground shadow-2xl lg:hidden">
            <NavContent />
          </aside>
        </>
      ) : null}
    </>
  );
};
