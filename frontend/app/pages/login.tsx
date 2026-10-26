'use client';

import { useEffect, useState } from 'react';
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
  const { sendPasswordResetEmail, signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [remainingLockSeconds, setRemainingLockSeconds] = useState(0);

  useEffect(() => {
    const storedLock = window.localStorage.getItem('centific-login-lock');
    if (!storedLock) return;

    try {
      const { failedAttempts: storedFailedAttempts, lockedUntil: storedLockedUntil } = JSON.parse(storedLock) as {
        failedAttempts: number;
        lockedUntil: number | null;
      };

      if (storedLockedUntil && storedLockedUntil <= Date.now()) {
        window.localStorage.removeItem('centific-login-lock');
        return;
      }

      setFailedAttempts(storedFailedAttempts);
      setLockedUntil(storedLockedUntil);
    } catch (error) {
      console.error('Unable to restore login lock state:', error);
      window.localStorage.removeItem('centific-login-lock');
    }
  }, []);

  const isLocked = lockedUntil !== null && lockedUntil > Date.now();

  useEffect(() => {
    if (!lockedUntil) {
      setRemainingLockSeconds(0);
      return;
    }

    const updateRemainingTime = () => {
      const seconds = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setRemainingLockSeconds(seconds);

      if (seconds === 0) {
        setLockedUntil(null);
        setFailedAttempts(0);
        window.localStorage.removeItem('centific-login-lock');
      }
    };

    updateRemainingTime();
    const intervalId = window.setInterval(updateRemainingTime, 1000);
    return () => window.clearInterval(intervalId);
  }, [lockedUntil]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) {
      toast.error(`Too many failed attempts. Try again in ${remainingLockSeconds} seconds.`);
      return;
    }

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
      setFailedAttempts(0);
      setLockedUntil(null);
      window.localStorage.removeItem('centific-login-lock');

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
          case 'auth/user-not-found':
          case 'auth/wrong-password': {
            const nextFailedAttempts = failedAttempts + 1;
            setFailedAttempts(nextFailedAttempts);

            if (nextFailedAttempts >= 5) {
              const nextLockedUntil = Date.now() + 30_000;
              setLockedUntil(nextLockedUntil);
              window.localStorage.setItem(
                'centific-login-lock',
                JSON.stringify({ failedAttempts: nextFailedAttempts, lockedUntil: nextLockedUntil })
              );
              toast.error('Too many failed attempts. Login is locked for 30 seconds.');
            } else {
              window.localStorage.setItem(
                'centific-login-lock',
                JSON.stringify({ failedAttempts: nextFailedAttempts, lockedUntil: null })
              );
              toast.error('Incorrect email or password.');
            }
            break;
          }

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

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(normalizedEmail);
      toast.success('Password reset email sent. Please check your inbox.');
      setIsResetMode(false);
    } catch (error) {
      console.error('Password reset failed:', error);
      if (error instanceof FirebaseError) {
        toast.error(
          error.code === 'auth/invalid-email'
            ? 'Please enter a valid email address.'
            : 'Unable to send the password reset email. Please try again.'
        );
      } else {
        toast.error('Unable to send the password reset email. Please try again.');
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
              {isResetMode ? 'Reset your password' : 'Talent Management System'}
            </CardTitle>
            <CardDescription>
              {isResetMode
                ? 'Enter your email and we will send you a reset link'
                : 'Sign in to access your account'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={isResetMode ? handlePasswordReset : handleLogin} className="space-y-4">
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

            {!isResetMode && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading || isLocked}
                    required
                  />
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    className="text-sm text-primary underline-offset-4 hover:underline"
                    onClick={() => setIsResetMode(true)}
                    disabled={loading}
                  >
                    Forgot password?
                  </button>
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading || (!isResetMode && isLocked)}>
              {loading
                ? isResetMode ? 'Sending reset email...' : 'Signing in...'
                : isResetMode ? 'Send reset email' : isLocked
                  ? `Try again in ${remainingLockSeconds}s`
                  : 'Sign In'}
            </Button>

            {isResetMode && (
              <button
                type="button"
                className="w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => setIsResetMode(false)}
                disabled={loading}
              >
                Back to sign in
              </button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}