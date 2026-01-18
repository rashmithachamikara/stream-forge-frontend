'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Shield, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User } from '@/types';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'John Admin',
      email: 'admin@streamforge.com',
      role: 'admin',
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      name: 'Jane Editor',
      email: 'editor@streamforge.com',
      role: 'editor',
      createdAt: new Date('2024-01-20'),
    },
    {
      id: '3',
      name: 'Bob Viewer',
      email: 'viewer@streamforge.com',
      role: 'viewer',
      createdAt: new Date('2024-02-01'),
    },
    {
      id: '4',
      name: 'Alice Content',
      email: 'alice@streamforge.com',
      role: 'editor',
      createdAt: new Date('2024-02-10'),
    },
    {
      id: '5',
      name: 'Charlie Watch',
      email: 'charlie@streamforge.com',
      role: 'viewer',
      createdAt: new Date('2024-02-15'),
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'editor' | 'viewer'>('all');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'viewer' as const,
    password: '',
  });

  const filteredUsers = users.filter(
    (user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    }
  );

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    const user: User = {
      id: String(users.length + 1),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: new Date(),
    };
    setUsers([...users, user]);
    setNewUser({ name: '', email: '', role: 'viewer', password: '' });
    setIsAddUserOpen(false);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setUsers(users.map((u) => (u.id === editingUser.id ? editingUser : u)));
    setEditingUser(null);
    setIsEditOpen(false);
  };

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter((user) => user.id !== id));
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: 'gradient-primary text-white border-0',
      editor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/30',
      viewer: 'bg-muted text-muted-foreground border border-border/30',
    };
    return colors[role as keyof typeof colors] || colors.viewer;
  };

  const userStats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    editors: users.filter((u) => u.role === 'editor').length,
    viewers: users.filter((u) => u.role === 'viewer').length,
  };

  return (
    <DashboardLayout title="User Management" requiredRoles={['admin']}>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{userStats.total}</div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{userStats.admins}</div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Editors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{userStats.editors}</div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Viewers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{userStats.viewers}</div>
            </CardContent>
          </Card>
        </div>

        {/* User Management Card */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>Manage system users and their roles</CardDescription>
            </div>
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 gradient-primary text-white font-medium">
                  <Plus className="w-4 h-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>Create a new user account with assigned role</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Full Name</label>
                    <Input
                      placeholder="John Doe"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className="h-10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Email</label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="h-10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Password</label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="h-10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Role</label>
                    <select
                      value={newUser.role}
                      onChange={(e) =>
                        setNewUser({ ...newUser, role: e.target.value as any })
                      }
                      className="w-full px-3 py-2 h-10 border border-input bg-background dark:bg-secondary rounded-lg text-sm"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <Button type="submit" className="w-full h-10 gradient-primary text-white font-medium">
                    Create User
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 md:w-64"
                />
                <select
                  value={roleFilter}
                  onChange={(e) =>
                    setRoleFilter(e.target.value as 'all' | 'admin' | 'editor' | 'viewer')
                  }
                  className="h-10 px-3 border border-input bg-background dark:bg-secondary rounded-lg text-sm"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <div className="border border-border/30 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/30 bg-secondary/30 dark:bg-muted/30 hover:bg-secondary/30 dark:hover:bg-muted/30">
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold">Email</TableHead>
                        <TableHead className="font-semibold">Role</TableHead>
                        <TableHead className="font-semibold">Joined</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <TableRow
                            key={user.id}
                            className="border-border/30 hover:bg-secondary/40 dark:hover:bg-muted/40 transition-colors"
                          >
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                            <TableCell>
                              <Badge className={getRoleBadgeColor(user.role)}>
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {user.createdAt.toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-secondary"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingUser(user);
                                      setIsEditOpen(true);
                                    }}
                                  >
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="text-destructive cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No users found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        {editingUser && (
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>Update user information and role</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Full Name</label>
                  <Input
                    placeholder="John Doe"
                    value={editingUser.name}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, name: e.target.value })
                    }
                    className="h-10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Email</label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={editingUser.email}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, email: e.target.value })
                    }
                    className="h-10"
                    required
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, role: e.target.value as any })
                    }
                    className="w-full px-3 py-2 h-10 border border-input bg-background dark:bg-secondary rounded-lg text-sm"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <Button type="submit" className="w-full h-10 gradient-primary text-white font-medium">
                  Save Changes
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
