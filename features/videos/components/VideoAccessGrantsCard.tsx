'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/shared/lib/api';
import { AccessGrant, AccessGrantPermission } from '@/features/videos/types';
import { UserProfile } from '@/features/admin/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Ban, Copy, KeyRound, Link2, Loader2, Plus, RefreshCw, Users } from 'lucide-react';
import { capitalize } from '@/shared/lib/utils';

type GrantFormState = {
  userId: string;
  permissionType: AccessGrantPermission;
  shareToken: string;
  expiresAt: string;
  searchTerm: string;
};

const DEFAULT_FORM: GrantFormState = {
  userId: '',
  permissionType: 'View',
  shareToken: '',
  expiresAt: '',
  searchTerm: '',
};

const PERMISSION_OPTIONS: AccessGrantPermission[] = ['View', 'Embed', 'Download'];
const ACCESS_STATUS_FILTER_OPTIONS = [
  { label: 'All grants', value: 'all' as const },
  { label: 'Active', value: 'active' as const },
  { label: 'Inactive', value: 'inactive' as const },
];

type AccessStatusFilter = 'all' | 'active' | 'inactive';

const formatDateTime = (value: Date | null) => {
  if (!value) {
    return 'No expiry';
  }

  return value.toLocaleString();
};

export function VideoAccessGrantsCard({ videoId, canManageAccess }: { videoId: string; canManageAccess: boolean }) {
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingGrants, setIsLoadingGrants] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastShareToken, setLastShareToken] = useState<string | null>(null);
  const [deactivatePendingId, setDeactivatePendingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AccessStatusFilter>('all');
  const [form, setForm] = useState<GrantFormState>(DEFAULT_FORM);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === form.userId) ?? null,
    [form.userId, users]
  );

  const loadGrants = useCallback(async () => {
    setIsLoadingGrants(true);
    setError(null);

    const response = await apiClient.getVideoAccessGrants(videoId, {
      page: 1,
      pageSize: 24,
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    });

    if (response.success && response.data) {
      setGrants(response.data.items);
    } else {
      setGrants([]);
      setError(response.error ?? 'Failed to load access grants');
    }

    setIsLoadingGrants(false);
  }, [statusFilter, videoId]);

  const loadUsers = useCallback(async (searchTerm?: string) => {
    setIsLoadingUsers(true);

    const response = await apiClient.getUsers({
      search: searchTerm?.trim() || undefined,
      page: 1,
      pageSize: 12,
    });

    if (response.success && response.data) {
      setUsers(response.data.items);
    } else {
      setUsers([]);
    }

    setIsLoadingUsers(false);
  }, []);

  useEffect(() => {
    const run = async () => {
      await loadGrants();
    };

    void run();
  }, [loadGrants]);

  useEffect(() => {
    if (!isDialogOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadUsers(form.searchTerm);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [form.searchTerm, isDialogOpen, loadUsers]);

  useEffect(() => {
    if (!isDialogOpen) {
      return;
    }

    const run = async () => {
      await loadUsers(form.searchTerm);
    };

    void run();
  }, [form.searchTerm, isDialogOpen, loadUsers]);

  const copyShareToken = async (value: string) => {
    await navigator.clipboard.writeText(value);
    toast.success('Share token copied to clipboard');
  };

  const handleCreateGrant = async (event: React.FormEvent) => {
    event.preventDefault();

    const userId = form.userId.trim();
    const shareToken = form.shareToken.trim();

    if (!userId && !shareToken) {
      setError('Choose a user or enter a share token.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const response = await apiClient.createVideoAccessGrant(videoId, {
      userId: userId || undefined,
      shareToken: shareToken || undefined,
      permissionType: form.permissionType,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
    });

    if (response.success && response.data) {
      const createdGrant = response.data;
      setGrants((current) => [createdGrant, ...current.filter((grant) => grant.id !== createdGrant.id)]);
      toast.success('Access grant created successfully');
      setLastShareToken(createdGrant.shareToken);
      setForm(DEFAULT_FORM);
      setIsDialogOpen(false);
    } else {
      toast.error(response.error ?? 'Failed to create access grant');
    }

    setIsSubmitting(false);
  };

  const handleDeactivateGrant = async (grant: AccessGrant) => {
    if (!window.confirm(`Deactivate access grant for ${grant.userName || grant.shareToken || 'this recipient'}?`)) {
      return;
    }

    setDeactivatePendingId(grant.id);
    setError(null);

    const response = await apiClient.deleteVideoAccessGrant(videoId, grant.id);

    if (response.success) {
      if (statusFilter === 'active') {
        setGrants((current) => current.filter((item) => item.id !== grant.id));
      } else {
        setGrants((current) =>
          current.map((item) => (item.id === grant.id ? { ...item, isActive: false } : item))
        );
      }
      toast.success('Access grant deactivated successfully');
    } else {
      toast.error(response.error ?? 'Failed to deactivate access grant');
    }

    setDeactivatePendingId(null);
  };

  if (!canManageAccess) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>Access Grants</CardTitle>
          <CardDescription>Control who can view, embed, or download this video.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AccessStatusFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACCESS_STATUS_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => void loadGrants()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add grant
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Add access grant</DialogTitle>
                <DialogDescription>Grant access to an existing user or create a share token.</DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleCreateGrant}>
                <div className="space-y-2">
                  <Label htmlFor="grant-search">Find user</Label>
                  <Input
                    id="grant-search"
                    value={form.searchTerm}
                    onChange={(event) => setForm((current) => ({ ...current, searchTerm: event.target.value }))}
                    placeholder="Search backend users..."
                  />
                  <p className="text-xs text-muted-foreground">
                    {isLoadingUsers ? 'Loading matching users...' : 'Use the dropdown below to pick a backend user.'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grant-user">User</Label>
                  <select
                    id="grant-user"
                    value={form.userId}
                    onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Select a user</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                  {selectedUser && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {selectedUser.name} {selectedUser.isActive ? '(active)' : '(inactive)'}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Permission</Label>
                    <Select
                      value={form.permissionType}
                      onValueChange={(value) =>
                        setForm((current) => ({ ...current, permissionType: value as AccessGrantPermission }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERMISSION_OPTIONS.map((permission) => (
                          <SelectItem key={permission} value={permission}>
                            {permission}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expires-at">Expires at</Label>
                    <Input
                      id="expires-at"
                      type="datetime-local"
                      value={form.expiresAt}
                      onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="share-token">Share token</Label>
                  <Input
                    id="share-token"
                    value={form.shareToken}
                    onChange={(event) => setForm((current) => ({ ...current, shareToken: event.target.value }))}
                    placeholder="Optional share token"
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="gap-2">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                    Create grant
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {lastShareToken && (
          <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <Link2 className="h-4 w-4" />
              Share token
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <code className="break-all rounded bg-background px-2 py-1 text-xs">{lastShareToken}</code>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => void copyShareToken(lastShareToken)}>
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
          </div>
        )}

        {isLoadingGrants ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading access grants...
          </div>
        ) : grants.length > 0 ? (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Permission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grants.map((grant) => (
                  <TableRow key={grant.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{grant.userName || grant.shareToken || 'Unnamed grant'}</p>
                        <p className="text-xs text-muted-foreground">
                          {grant.userId ? `User ${grant.userId}` : grant.shareToken ? 'Share-token grant' : grant.videoId}
                        </p>
                        {grant.shareToken && (
                          <code className="block break-all text-xs text-muted-foreground">{grant.shareToken}</code>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{capitalize(grant.permissionType)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={grant.isActive ? 'outline' : 'secondary'}>{grant.isActive ? 'Active' : 'Inactive'}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(grant.expiresAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => void handleDeactivateGrant(grant)}
                        disabled={!grant.isActive || deactivatePendingId === grant.id}
                      >
                        {deactivatePendingId === grant.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Ban className="h-4 w-4" />
                        )}
                        {grant.isActive ? 'Deactivate' : 'Inactive'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            <Users className="h-5 w-5" />
            No access grants yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
