'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    <div className="portal-grid relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_42%)]" />
      <div className="relative grid w-full max-w-[1220px] gap-8 lg:grid-cols-[minmax(0,1.1fr)_420px]">
        <div className="hidden rounded-[2rem] border border-border/70 bg-[linear-gradient(180deg,hsl(var(--card)/0.95),hsl(var(--card)/0.85))] p-10 shadow-[0_24px_60px_hsl(220_35%_18%/0.08)] lg:block">
          <div className="max-w-xl space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] gradient-primary shadow-[0_16px_34px_hsl(var(--primary)/0.22)]">
              <span className="text-2xl font-semibold tracking-[0.2em] text-white">SF</span>
            </div>
            <div className="space-y-4">
              <p className="portal-kicker">Portal Access</p>
              <h1 className="text-5xl font-semibold tracking-[-0.05em] text-foreground text-balance">Stream Forge</h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">Sign in with your organization account.</p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md lg:justify-self-end">
          <div className="mb-8 text-center lg:hidden">
            <div className="mb-4 flex items-center justify-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-primary">
                <span className="font-semibold tracking-[0.18em] text-primary-foreground">SF</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-[-0.04em] text-foreground">Stream Forge</h1>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Organization sign-in
            </p>
          </div>

          <Card className="w-full">
            <CardHeader className="space-y-3">
              <p className="portal-kicker">Portal Access</p>
              <CardTitle className="text-3xl tracking-[-0.04em]">Sign in</CardTitle>
              <CardDescription>Use your organization credentials to continue into Stream Forge.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {error ? (
                  <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}

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
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full text-base" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
