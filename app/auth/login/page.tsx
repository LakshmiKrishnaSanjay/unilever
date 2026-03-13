'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useWorkflowActions } from '@/lib/use-workflow';

type Role =
  | 'super_admin'
  | 'hse_manager'
  | 'stakeholder'
  | 'facilities'
  | 'efs'
  | 'security'
  | 'supervisor'
  | 'contractor_admin'
  | 'contractor_supervisor'
  | 'viewer';

const roleDashboards: Record<Role, string> = {
  super_admin: '/admin/dashboard',
  hse_manager: '/hse/dashboard',
  stakeholder: '/stakeholder/dashboard',
  facilities: '/facilities/dashboard',
  efs: '/efs/dashboard',
  security: '/security/dashboard',
  supervisor: '/supervisor/dashboard',
  contractor_admin: '/contractor/dashboard',
  contractor_supervisor: '/contractor-supervisor/dashboard',
  viewer: '/viewer/dashboard',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  // ✅ Hook must be called here
  const workflowActions = useWorkflowActions();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    try {
      // ✅ Your workflow login should do:
      // supabase.auth.signInWithPassword + fetch user from public.users by auth_id
      const { role } = await workflowActions.login(email, password);

      toast.success('Logged in successfully');
      router.push(roleDashboards[role]);
    } catch (err: any) {
      toast.error(err?.message || 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto mb-2">
            <svg
              viewBox="0 0 708.98 174.63"
              className="h-12 w-auto mx-auto text-primary"
              aria-label="Unilever"
            >
              <path
                fill="currentColor"
                d="M8.57,103.46v-15.67c1.76-12.59,4.86-45.79,14.59-54.32,4.35-3.82,16.24-8.44,17.71.14,1.19,6.99-2.98,21.94-4.10,29.69-3.86,26.51-9.72,89.23,32.09,85.6,28.92-2.51,35.14-54.9,29.93-76.46-2.78-11.52-9.40-21.07-5.51-33.70,2.44-7.93,13.65-17.71,20.06-8.41,8.16,11.86,6.82,54.87,4.88,69.56-4.94,37.45-28.11,68.48-69.66,60.09-28.37-5.73-38.46-30.17-39.97-56.50Z"
              />
              <path
                fill="currentColor"
                d="M390.67,138.61c-.93,1.33,4.87,3.88,5.79,4.19,22.91,7.82,37.76-21.43,44.72-38.27,2.33-5.63,6.40-21.10,11.43-23.70,5.61-2.90,7.73,3.79,9.25,7.91,4.29,11.59,10.05,47.14,19.94,53.02,7.73,4.59,13.05-8.19,14.52-13.97,4.16-16.41-7.48-31.59,3.38-46.88,6.18-8.69,16.82-9.71,18.35,2.98,2.74,22.72-18.29,78.12-47.13,75.24-15.29-1.53-15.19-22.60-20.71-32.26-.87-1.53-1.72-2.50-3.62-2.39-3.43.21-11.95,12.38-14.85,15.48-11.12,11.88-27.20,20.96-44.08,19.73-7.28-.53-12.50-4.70-17.81-9.22-10.36,6.49-24.64,12.40-36.45,6.19-4.58-2.41-13.29-12.60-17.06-12.59-3.26,0-12.48,7.73-16.12,9.75-10.12,5.60-25.20,9.25-34.96,1.26-6.35-5.19-8.17-12.97-12.98-18.37-1.37-1.54-2.63-2.92-4.82-2.17-3.44,1.19-12.47,17.26-16.44,21.15-3.49,3.42-6.70,5.18-11.52,2.99-8.90-4.05-14.84-25.02-19.89-33.61-7.68-13.05-12.53-10.95-23.23-2.68-12.75,9.85-25.84,26.53-39.02,34.48-4.78,2.88-11.26,4.10-11.56-3.41-.27-6.72,5.05-20.11,6.91-27.18,1.95-7.45,6.05-29.22,10.14-34.18,1.56-1.89,6.38-5.12,8.42-2.99,1.78,1.85,4.17,17.08,6.45,21.65.87,1.74,1.70,3.88,4.03,3.52,3.37-.51,17.73-21.67,21.36-25.70s10.75-12.42,16.21-8.07c5.68,4.53,10.30,25.43,12.97,32.97,3.82,10.76,12.96,32.41,25.33,15.02,6.96-9.78,4.75-16.61,7.28-27.31,1.74-7.39,5.74-18.95,15.27-17.75,7.61.96,8.26,17.31,7.80,22.99-.38,4.71-2.86,9.73-2.72,14.08.86,27.45,34.34,27.99,45.31,6.93-8.99-24.95-11.17-51.93-4.82-77.82,3.57-14.56,15.31-45.68,35.37-33.61,17.85,10.73,13.18,52.98,8.86,70.28-3.60,14.44-10.48,27.43-17.46,40.42-.80,3.23,5.68,10.31,8.17,12.41,3.70,3.12,10.16,6.62,15.11,6.54,1.97-.03,9.91-1.94,9.97-4.04s-1.46-6.55-1.61-9.22c-.79-13.66,4.78-31.12,13.55-41.62,10.22-12.25,25.27-17.78,34.66-1.19,12.60,22.24-3.21,38.42-21.71,49.02ZM330.53,37.10c-5.27,1.20-7.73,14.56-8.42,19.15-1.40,9.33-2.58,43.28,2.51,50.30,3.08,4.26,5.40-.65,6.89-3.61,6.72-13.40,12.70-46.46,7.38-60.38-1.36-3.55-4.27-6.39-8.36-5.46ZM393.72,126.51c5.23-5.31,7.55-16.40,4.37-23.17s-8.57-6.52-13.55-1.95c-7.08,6.50-6.07,22.96.18,29.94,1.63.84,7.75-3.56,8.99-4.82Z"
              />
              <path
                fill="currentColor"
                d="M604.70,120.76c-9.20,21-27.94,40.54-52.72,38.94-39.23-2.54-32.42-60.83-4.94-75.25,26.66-13.99,47.82,21.40,26.86,39.29-7.80,6.66-17.79,8.04-26.24,13.24-1.69,3.42,4.76,6.64,7.29,7.32,22.84,6.13,38.82-19.88,45.43-37.85,2.42-6.57,3.98-19.26,10.80-22.16,5.44-2.31,5.88,2.31,6.86,6.64,1.79,7.92,2.38,30.94,7.18,36.06,1.95,2.08,3.50,1.77,4.98-.45,3.30-4.97,5.46-12.82,8.08-18.40,8.91-18.97,21.44-38.23,45.53-35.42,8.50.99,17.22,7.64,16.56,16.96-.79,11.08-15.54,14.59-22.16,6.48-3.69-4.51-2.71-7.93-10.43-5.54-17.20,5.33-29.12,48.60-38.33,63.28-2.66,4.24-6.77,8.07-11.75,4.40-6.94-5.12-8.90-27.83-11.95-36.16-.21-.58-.24-1.30-1.05-1.37ZM543.08,127.79c11.38-1.93,25.77-12.40,19.75-25.43-2.32-5.01-7.20-6.44-12.31-4.70-9.69,3.30-10.09,22.02-7.43,30.13Z"
              />
              <path
                fill="currentColor"
                d="M260.82,19.28c23.14-3.96,17.68,32.35-2.16,28.93-13.08-2.25-10.34-26.79,2.16-28.93Z"
              />
            </svg>
          </div>

          <CardTitle className="text-2xl">Digital Permit System</CardTitle>
          <CardDescription>Sign in to access the MOC & PTW system</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>

          <div className="mt-6 space-y-2 rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium">Login:</p>
            <p className="text-muted-foreground">1. Enter your email</p>
            <p className="text-muted-foreground">2. Enter your password</p>
            <p className="text-muted-foreground">3. Click Sign In</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}