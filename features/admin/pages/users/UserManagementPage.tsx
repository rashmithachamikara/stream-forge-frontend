'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { apiClient } from '@/shared/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RoleChip } from '@/shared/components/RoleChip';
import { RoleFilter, USER_ROLE_FILTER_OPTIONS } from '@/shared/lib/roles';
import { UserListFilters, UserProfile } from '@/features/admin/types';
import { Loader2, Search, ChevronLeft, ChevronRight, Users, ShieldCheck } from 'lucide-react';
import { ErrorPanel, PageHeader } from '@/shared/components/AppChrome';

const PAGE_SIZE = 12;
const ACTIVE_FILTER_OPTIONS = [
  { label: 'All status', value: 'all' as const },
  { label: 'Active', value: 'active' as const },
  { label: 'Inactive', value: 'inactive' as const },
];

type ActiveFilter = 'all' | 'active' | 'inactive';

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

      if (!isMounted) {
        return;
      }

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

  const resetToFirstPage = () => {
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    resetToFirstPage();
  };

  const handleRoleChange = (value: string) => {
    setRoleFilter(value as RoleFilter);
    resetToFirstPage();
  };

  const handleActiveChange = (value: string) => {
    setActiveFilter(value as ActiveFilter);
    resetToFirstPage();
  };

  const goToPreviousPage = () => {
    setCurrentPage((page) => Math.max(1, page - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((page) => {
      if (pageCount > 0) {
        return Math.min(page + 1, pageCount);
      }

      return page + 1;
    });
  };

  return (
    <DashboardLayout title="User Management" requiredRoles={['admin']}>
      <div className="space-y-6">
        <PageHeader title="User Management" description="Browse, filter, and audit platform user access." />
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Users</CardTitle>
              <CardDescription>Browse and filter backend users.</CardDescription>
            </div>
            <Badge variant="secondary" className="gap-1.5">
              <Users className="h-3 w-3" />
              {totalCount} total
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_180px_180px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  placeholder="Search by name or email..."
                  className="pl-9"
                />
              </div>
              <Select value={roleFilter} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLE_FILTER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={activeFilter} onValueChange={handleActiveChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVE_FILTER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && <ErrorPanel message={error} />}

            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        <div className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading users...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <RoleChip role={user.role} />
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? 'secondary' : 'outline'} className="gap-1.5">
                            <ShieldCheck className="h-3 w-3" />
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.createdAt.toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {users.length} of {totalCount} users
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage <= 1 || isLoading}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="min-w-24 text-center text-sm text-muted-foreground">
                  Page {currentPage}
                  {pageCount > 0 ? ` of ${pageCount}` : ''}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={isLoading || pageCount === 0 || currentPage >= pageCount}
                  className="gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
