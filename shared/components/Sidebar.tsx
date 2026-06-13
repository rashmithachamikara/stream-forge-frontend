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
      <nav className="flex-1 space-y-1.5 px-3 py-5">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const href = item.href === '/dashboard' && activeView ? VIEW_DASHBOARD_PATHS[activeView] : item.href;
          const isActive =
            pathname === href ||
            pathname.startsWith(`${href}/`) ||
            (item.href === '/dashboard' && pathname.startsWith('/dashboard'));

          return (
            <Link key={item.href} href={href}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'h-10 w-full justify-start gap-3 rounded-lg font-semibold transition-all duration-200',
                  isActive
                    ? 'border border-primary/30 bg-primary/15 text-foreground shadow-[inset_3px_0_0_var(--primary)]'
                    : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
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
      {/* Mobile Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-[55] rounded-lg border border-border/70 bg-background/85 shadow-lg backdrop-blur-xl hover:bg-secondary lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Desktop Sidebar */}
      <aside
        data-app-sidebar
        className="sticky top-16 hidden h-[calc(100dvh-64px)] w-64 flex-col border-r border-border/70 bg-sidebar/70 shadow-[20px_0_60px_rgba(0,0,0,0.18)] backdrop-blur-xl lg:flex"
      >
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/75 backdrop-blur-sm lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          <aside
            data-app-sidebar
            className="fixed left-0 top-16 z-50 h-[calc(100dvh-64px)] w-72 overflow-y-auto border-r border-border/70 bg-sidebar/95 shadow-2xl backdrop-blur-xl lg:hidden"
          >
            <NavContent />
          </aside>
        </>
      )}
    </>
  );
};
