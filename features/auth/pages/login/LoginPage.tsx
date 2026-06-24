'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirect based on role if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardPath = `/dashboard/${user.role}`;
      router.push(dashboardPath);
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await login(email, password);
    if (success) {
      // Redirect will happen automatically via useEffect
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-foreground text-background">
        <div className="flex items-center gap-2">
          <div className="size-6 bg-background rounded grid place-items-center">
            <div className="size-2.5 bg-foreground rotate-45" />
          </div>
          <span className="font-bold tracking-tight text-sm uppercase">Stream Forge</span>
        </div>
        <div className="max-w-md text-left">
          <p className="text-xs font-mono uppercase tracking-widest opacity-60 mb-4">Enterprise video</p>
          <h1 className="text-4xl font-bold tracking-tight leading-tight mb-6 text-balance">
            Secure, scalable video delivery for serious organizations.
          </h1>
          <p className="text-sm opacity-70 leading-relaxed">
            Stream Forge powers internal town halls, training libraries, and customer-facing media for companies that can&apos;t compromise on reliability.
          </p>
        </div>
        <p className="text-[11px] font-mono opacity-50 text-left">© 2026 Stream Forge Systems</p>
      </div>

      {/* Right side - Login Form */}
      <div className="flex items-center justify-center px-6 py-12">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6 text-left">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Welcome back</p>
            <h2 className="text-2xl font-bold tracking-tight">Sign in to your portal</h2>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-semibold text-foreground mb-1.5 block">Work email</span>
              <input
                type="email"
                placeholder="admin@streamforge.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-foreground mb-1.5 flex items-center justify-between">
                Password
                <a href="#" className="text-[11px] font-normal text-muted-foreground hover:text-foreground">Forgot?</a>
              </span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full bg-card border border-border rounded-md pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </label>
          </div>

          {error && (
            <p className="text-xs text-destructive font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-foreground text-background py-2.5 rounded-md text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : (
              <>
                Continue <ArrowRight className="size-4" />
              </>
            )}
          </button>

          <p className="text-[11px] text-muted-foreground text-center">
            Use the credentials provisioned by your Stream Forge administrator.
          </p>
        </form>
      </div>
    </div>
  );
}
