'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FirebaseError } from 'firebase/app';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      // Login
      const signedInUser = await signIn(normalizedEmail, password);

      // User exists in Firebase but not in Firestore
      if (!signedInUser) {
        toast.error(
          'Your account is not mapped to a Centific role yet. Please contact the administrator.'
        );
        return;
      }

      toast.success('Login successful!');
      router.push(signedInUser.role === 'Super Admin' ? '/users' : '/dashboard');
    } catch (error) {
      console.error('Login failed:', error);

      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/invalid-credential':
            toast.error('Incorrect email or password.');
            break;

          default:
            toast.error(`Login failed: ${error.message}`);
        }
      } else if (error instanceof Error) {
        // Custom errors thrown from AuthContext
        switch (error.message) {
          case 'role-not-assigned':
            toast.error(
              'Your account does not have a role assigned. Please contact your administrator.'
            );
            break;

          default:
            toast.error(error.message);
        }
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <Image
              src="/images/centificlogo.png"
              alt="Centific"
              width={150}
              height={48}
              className="h-12 w-auto mix-blend-multiply dark:mix-blend-normal dark:brightness-0 dark:invert"
              priority
            />
          </div>

          <div className="text-center">
            <CardTitle className="text-2xl">
              Talent Management System
            </CardTitle>
            <CardDescription>
              Sign in to access your account
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@centific.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
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
                disabled={loading}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}