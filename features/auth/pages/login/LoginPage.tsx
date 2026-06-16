'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

const trustPoints = [
  'Private video delivery with role-aware access',
  'Operational analytics for content and engagement',
  'Admin controls for teams, taxonomy, and retention',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <main className="flex min-h-dvh w-full max-w-full items-center justify-center overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-base font-bold tracking-[-0.04em] text-primary-foreground shadow-[0_14px_32px_hsl(var(--primary)/0.18)]">
              SF
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Stream Forge</p>
              <p className="text-xs text-muted-foreground">Enterprise video operations</p>
            </div>
          </div>

          <div className="max-w-5xl space-y-5">
            <h1 className="text-balance text-4xl font-semibold tracking-[-0.035em] text-foreground sm:text-5xl lg:text-6xl">
              Secure video workflows for teams that need control.
            </h1>
            <p className="max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              Manage playback, access, uploads, and analytics from one calm workspace built for administrators,
              editors, and viewers.
            </p>
          </div>

          <div className="grid max-w-3xl gap-3 sm:grid-cols-3">
            {trustPoints.map((point) => (
              <div key={point} className="rounded-lg border border-border/70 bg-card/72 p-4">
                <CheckCircle2 className="mb-3 h-4 w-4 text-primary" />
                <p className="text-sm font-medium leading-5 text-foreground">{point}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex justify-center lg:justify-end">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl">Sign in</CardTitle>
              <CardDescription>Use the credentials provisioned by your Stream Forge administrator.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2.5">
                  <label htmlFor="email" className="text-sm font-semibold text-foreground">
                    Email address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@streamforge.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2.5">
                  <label htmlFor="password" className="text-sm font-semibold text-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" size="lg" className="h-11 w-full text-base" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>

      <p className="absolute bottom-5 left-0 w-full px-4 text-center text-xs text-muted-foreground">
        &copy; 2026 Stream Forge. Secure video delivery for modern organizations.
      </p>
    </main>
  );
}
