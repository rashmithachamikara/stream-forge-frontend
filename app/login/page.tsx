'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
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
    <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center bg-background dark:bg-gradient-to-br dark:from-background dark:to-secondary p-4">
      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center text-center px-8">
        <div className="max-w-md">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
            <span className="text-2xl font-bold text-white">SF</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Stream Forge</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Self-hosted video streaming platform built for teams that demand control, flexibility, and enterprise-grade reliability.
          </p>
          <div className="space-y-4 text-left">
            <div className="flex gap-3">
              <div className="text-accent text-xl flex-shrink-0">✓</div>
              <div>
                <p className="font-semibold text-foreground">Full Control</p>
                <p className="text-sm text-muted-foreground">Host videos on your own infrastructure</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-accent text-xl flex-shrink-0">✓</div>
              <div>
                <p className="font-semibold text-foreground">Advanced Analytics</p>
                <p className="text-sm text-muted-foreground">Track viewer engagement in real-time</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-accent text-xl flex-shrink-0">✓</div>
              <div>
                <p className="font-semibold text-foreground">Role-Based Access</p>
                <p className="text-sm text-muted-foreground">Manage permissions for admins, editors, and viewers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 max-w-sm lg:flex lg:justify-center">
        {/* Mobile Logo */}
        <div className="lg:hidden text-center mb-8 w-full">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">SF</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Stream Forge</h1>
          </div>
        </div>

        {/* Login Card */}
        <Card className="w-full border-border/50 shadow-xl dark:shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2.5">
                <label htmlFor="email" className="text-sm font-semibold text-foreground">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@streamforge.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 bg-secondary dark:bg-background/50 border-border/50 focus-visible:border-primary transition-colors"
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
                    className="h-11 bg-secondary dark:bg-background/50 border-border/50 focus-visible:border-primary pr-10 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full h-11 text-base gradient-primary font-semibold" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="mt-6 p-4 bg-secondary/50 dark:bg-muted/30 rounded-xl border border-border/30">
                <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Demo Credentials</p>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Admin</span>
                    <span className="font-mono text-foreground">admin@streamforge.com</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Editor</span>
                    <span className="font-mono text-foreground">editor@streamforge.com</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Viewer</span>
                    <span className="font-mono text-foreground">viewer@streamforge.com</span>
                  </div>
                  <div className="pt-2 border-t border-border/30 flex justify-between items-start">
                    <span className="text-muted-foreground">Password</span>
                    <span className="font-mono text-foreground">password</span>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

      </div>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground mt-8 lg:absolute lg:bottom-8 w-full px-4">
        &copy; 2026 Stream Forge. Enterprise-grade video streaming platform.
      </p>
    </div>
  );
}

// Icon components
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
