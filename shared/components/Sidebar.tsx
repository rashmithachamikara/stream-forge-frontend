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
                  'h-10 w-full justify-start gap-3 rounded-md font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-[0_10px_24px_hsl(var(--primary)/0.16)]'
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
        className="fixed left-4 top-4 z-40 rounded-lg bg-background/80 shadow-sm hover:bg-secondary lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Desktop Sidebar */}
      <aside className="sticky top-16 hidden h-[calc(100dvh-64px)] w-64 flex-col border-r border-border/70 bg-background/60 lg:flex">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-foreground/30 lg:hidden" onClick={() => setIsOpen(false)} />
          <aside className="fixed left-0 top-16 z-40 h-[calc(100dvh-64px)] w-72 overflow-y-auto border-r border-border/70 bg-background shadow-[0_24px_60px_hsl(213_28%_28%/0.2)] lg:hidden">
            <NavContent />
          </aside>
        </>
      )}
    </>
  );
};
