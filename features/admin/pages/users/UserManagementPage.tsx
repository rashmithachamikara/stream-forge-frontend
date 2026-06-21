'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { apiClient } from '@/shared/lib/api';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RoleFilter } from '@/shared/lib/roles';
import { UserListFilters, UserProfile } from '@/features/admin/types';
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Shield,
  UserCheck,
  UserX,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const PAGE_SIZE = 12;

const ACTIVE_FILTER_OPTIONS = [
  { label: 'All status', value: 'all' as const },
  { label: 'Active', value: 'active' as const },
  { label: 'Inactive', value: 'inactive' as const },
];

const ROLE_TABS: { label: string; value: RoleFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Admin', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer' },
];

type ActiveFilter = 'all' | 'active' | 'inactive';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function relTime(date: Date) {
  const d = (Date.now() - date.getTime()) / 1000;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

function Stat({ label, value, isLoading }: { label: string; value: string; isLoading: boolean }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">{label}</p>
      <p className="text-2xl font-bold tracking-tight font-mono">{isLoading ? '-' : value}</p>
    </div>
  );
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      setIsLoading(true);
      setError(null);

      const filters: UserListFilters = {
        search: searchTerm.trim() || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter,
        isActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
        page: currentPage,
        pageSize: PAGE_SIZE,
      };

      const response = await apiClient.getUsers(filters);

      if (!isMounted) return;

      if (response.success && response.data) {
        setUsers(response.data.items);
        setPageCount(response.data.totalPages);
        setTotalCount(response.data.totalCount);
      } else {
        setUsers([]);
        setPageCount(0);
        setTotalCount(0);
        setError(response.error ?? 'Failed to load users');
      }

      setIsLoading(false);
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, [activeFilter, currentPage, roleFilter, searchTerm]);

  const resetToFirstPage = () => setCurrentPage(1);

  const handleSearchChange = (value: string) => { setSearchTerm(value); resetToFirstPage(); };
  const handleRoleChange = (value: RoleFilter) => { setRoleFilter(value); resetToFirstPage(); };
  const handleActiveChange = (value: string) => { setActiveFilter(value as ActiveFilter); resetToFirstPage(); };
  const goToPreviousPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToNextPage = () => setCurrentPage((p) => (pageCount > 0 ? Math.min(p + 1, pageCount) : p + 1));

  // Derived counts from the currently loaded page
  const activeCount = useMemo(() => users.filter((u) => u.isActive).length, [users]);
  const inactiveCount = useMemo(() => users.filter((u) => !u.isActive).length, [users]);
  const adminCount = useMemo(() => users.filter((u) => u.role === 'admin').length, [users]);
  const editorCount = useMemo(() => users.filter((u) => u.role === 'editor').length, [users]);

  return (
    <DashboardLayout title="User Management" requiredRoles={['admin']}>
      <div className="space-y-8">

        {/* Header */}
        <div className="flex items-end justify-between border-b border-border pb-5">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Admin · Users</p>
            <h1 className="text-2xl font-bold tracking-tight mt-1 text-foreground">User management</h1>
          </div>
          <button
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-1.5 bg-foreground text-background px-3 py-2 rounded-md text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="size-3.5" /> Invite user
          </button>
        </div>

        {/* KPI Stat Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Total users" value={totalCount.toString()} isLoading={isLoading} />
          <Stat label="Active" value={activeCount.toString()} isLoading={isLoading} />
          <Stat label="Admins" value={adminCount.toString()} isLoading={isLoading} />
          <Stat label="Editors" value={editorCount.toString()} isLoading={isLoading} />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[16rem]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <input
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full bg-card border border-border rounded-md py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Role tab bar */}
          <div className="flex items-center gap-1 bg-card border border-border rounded-md p-0.5">
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleRoleChange(tab.value)}
                className={cn(
                  'px-3 py-1.5 text-[11px] font-medium rounded transition-all cursor-pointer',
                  roleFilter === tab.value
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <Select value={activeFilter} onValueChange={handleActiveChange}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTIVE_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="border border-destructive/20 bg-destructive/5 rounded-lg p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
                <th className="text-left font-medium px-4 py-2.5">User</th>
                <th className="text-left font-medium px-4 py-2.5">Role</th>
                <th className="text-left font-medium px-4 py-2.5">Status</th>
                <th className="text-left font-medium px-4 py-2.5">Joined</th>
                <th className="px-4 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-xs text-muted-foreground">
                    <div className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" /> Loading users...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-xs text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors"
                  >
                    {/* User cell */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-muted ring-1 ring-border grid place-items-center text-[10px] font-semibold shrink-0 text-foreground">
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role cell */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider',
                          user.role === 'admin'
                            ? 'bg-primary/10 text-primary'
                            : user.role === 'editor'
                              ? 'bg-foreground/10 text-foreground'
                              : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {user.role === 'admin' && <Shield className="size-2.5" />}
                        {user.role}
                      </span>
                    </td>

                    {/* Status cell */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-foreground">
                        <span
                          className={cn(
                            'size-1.5 rounded-full',
                            user.isActive ? 'bg-success' : 'bg-muted-foreground/50',
                          )}
                        />
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Joined cell */}
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {relTime(user.createdAt)}
                    </td>

                    {/* Actions cell */}
                    <td className="px-4 py-3">
                      <button className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors">
                        <MoreHorizontal className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground font-mono">
            Showing {users.length} of {totalCount} users
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage <= 1 || isLoading}
              className="h-8 gap-1.5 text-xs font-mono"
            >
              <ChevronLeft className="size-3.5" /> Prev
            </Button>
            <span className="min-w-20 text-center text-xs text-muted-foreground font-mono">
              {currentPage}{pageCount > 0 ? ` / ${pageCount}` : ''}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={isLoading || pageCount === 0 || currentPage >= pageCount}
              className="h-8 gap-1.5 text-xs font-mono"
            >
              Next <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Invite user modal */}
      {inviteOpen && (
        <div
          className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4"
          onClick={() => setInviteOpen(false)}
        >
          <div
            className="bg-popover border border-border rounded-xl p-6 w-full max-w-md shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold mb-1 text-foreground">Invite user</h2>
            <p className="text-xs text-muted-foreground mb-5">
              They'll receive an email with a secure activation link.
            </p>

            <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
              Email
            </label>
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="user@company.com"
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs mb-4 focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground"
            />

            <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
              Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs mb-6 focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setInviteOpen(false)}
                className="px-3 py-1.5 text-xs border border-border rounded-md hover:bg-accent transition-colors text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => setInviteOpen(false)}
                className="px-3 py-1.5 text-xs bg-foreground text-background rounded-md font-semibold hover:opacity-90 transition-opacity"
              >
                Send invite
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
