'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Settings, Bell } from 'lucide-react';

interface HeaderProps {
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ title = 'Stream Forge' }) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [notificationOpen, setNotificationOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
                <Avatar className="h-9 w-9 border border-border/50">
                  <AvatarFallback className="gradient-primary text-white font-bold text-xs">
                    {getInitials(user?.name || 'User')}
                  </AvatarFallback>
                </Avatar>
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
