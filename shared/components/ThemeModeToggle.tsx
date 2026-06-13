'use client';

import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/lib/utils';

interface ThemeModeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeModeToggle({ className, showLabel = false }: ThemeModeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLight = mounted && resolvedTheme === 'light';
  const nextTheme = isLight ? 'dark' : 'light';
  const label = isLight ? 'Switch to dark mode' : 'Switch to light mode';

  return (
    <Button
      type="button"
      variant="outline"
      size={showLabel ? 'default' : 'icon'}
      className={cn('h-9 border-border/70 bg-secondary/40', showLabel && 'gap-2 px-3', className)}
      onClick={() => setTheme(nextTheme)}
      aria-label={label}
      title={label}
      suppressHydrationWarning
    >
      {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      {showLabel ? <span>{isLight ? 'Dark' : 'Light'}</span> : null}
    </Button>
  );
}
