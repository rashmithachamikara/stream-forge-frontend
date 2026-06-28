'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleSignOut = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border border-border bg-card shadow-none">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-destructive/10 text-destructive border border-destructive/20 rounded-full flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Access Denied</h1>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Your account current role does not have the permissions required to view this protected page.
            </p>
          </div>

          {/* Technical metadata log block */}
          <div className="bg-muted p-4 rounded-md text-left font-mono text-[11px] text-muted-foreground border border-border/40">
            <p className="font-semibold text-foreground mb-1">HTTP_403_FORBIDDEN</p>
            <p>CODE: ACCESS_DENIED</p>
            <p>SCOPE: ADMIN_CONSOLE_PREFERENCE</p>
            <p>ACTION: Contact administrator for role escalation</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={handleSignOut}>
              Sign Out
            </Button>
            <Button variant="default" className="flex-1" onClick={() => router.push('/dashboard')}>
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
