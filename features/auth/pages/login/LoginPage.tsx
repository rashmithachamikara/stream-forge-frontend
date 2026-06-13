'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, BarChart3, Check, Eye, EyeOff, Lock, PlayCircle, Server } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ThemeModeToggle } from '@/shared/components/ThemeModeToggle';

const capabilities = [
  {
    title: 'Own the stack',
    description: 'Run video storage, playback, and access rules on infrastructure you control.',
    icon: Server,
  },
  {
    title: 'Measure attention',
    description: 'Track playback, completion, and engagement without handing the viewer journey away.',
    icon: BarChart3,
  },
  {
    title: 'Gate every asset',
    description: 'Shape access for admins, editors, and viewers across teams and libraries.',
    icon: Lock,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push(`/dashboard/${user.role}`);
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await login(email, password);
  };

  return (
    <main className="relative grid min-h-[100dvh] overflow-hidden bg-background text-foreground lg:grid-cols-[1.08fr_0.92fr]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,color-mix(in_oklch,var(--primary)_24%,transparent),transparent_28rem)]" />
      <div className="fixed right-4 top-4 z-20">
        <ThemeModeToggle showLabel className="bg-background/75 backdrop-blur-xl" />
      </div>
      <section className="relative hidden min-h-[100dvh] flex-col justify-between overflow-hidden border-r border-border/70 px-10 py-10 lg:flex">
        <div className="absolute inset-8 overflow-hidden rounded-2xl border border-border/70 bg-secondary/20">
          <img src="/thumbnail-demo.svg" alt="Stream Forge media preview" className="h-full w-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-br from-background/55 via-background/82 to-background" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="gradient-primary flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 shadow-[0_16px_44px_color-mix(in_oklch,var(--primary)_28%,transparent)]">
            <span className="text-sm font-black tracking-[-0.04em] text-primary-foreground">SF</span>
          </div>
          <div>
            <p className="font-semibold tracking-[-0.02em] text-foreground">Stream Forge</p>
            <p className="text-xs text-muted-foreground">Self-hosted video operations</p>
          </div>
        </div>

        <div className="relative z-10 max-w-3xl pb-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <PlayCircle className="h-3.5 w-3.5" />
            Media control room
          </div>
          <h1 className="max-w-4xl text-6xl font-semibold leading-[0.95] tracking-[-0.075em] text-foreground xl:text-7xl">
            Video delivery with the controls left on.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
            Stream Forge gives teams a private command layer for hosting, publishing, and measuring video libraries.
          </p>
        </div>

        <div className="relative z-10 grid gap-3 pb-2">
          {capabilities.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex max-w-2xl items-start gap-3 rounded-xl border border-border/70 bg-background/55 p-4 backdrop-blur">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative flex min-h-[100dvh] items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="gradient-primary flex h-11 w-11 items-center justify-center rounded-xl">
              <span className="font-black text-primary-foreground">SF</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-[-0.03em]">Stream Forge</h1>
              <p className="text-xs text-muted-foreground">Video operations console</p>
            </div>
          </div>

          <Card className="border-primary/10 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-3xl">Sign in</CardTitle>
              <CardDescription>Use the credentials provisioned by your Stream Forge administrator.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold text-foreground">
                    Email address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@streamforge.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-semibold text-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in' : 'Sign in'}
                </Button>

                <div className="grid gap-2 rounded-lg border border-border/70 bg-secondary/35 p-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-primary" />
                    Protected access for internal video teams
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-primary" />
                    Role-aware dashboards after sign in
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Copyright 2026 Stream Forge. Enterprise-grade video streaming platform.
          </p>
        </div>
      </section>
    </main>
  );
}
