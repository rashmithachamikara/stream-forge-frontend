'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
              <p className="text-muted-foreground">
                You don't have permission to access this page. Your current role doesn't have the required access level.
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg text-left space-y-2 text-sm">
              <p className="font-semibold text-foreground">What can you do?</p>
              <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                <li>Return to your dashboard</li>
                <li>Contact your administrator for access</li>
                <li>Check your account permissions</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()}>
                Go Back
              </Button>
              <Button className="flex-1" onClick={() => router.push('/dashboard')}>
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
