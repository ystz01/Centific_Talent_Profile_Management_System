'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready } = useAuth();
  const isPublicRoute = pathname === '/';

  useEffect(() => {
    if (ready && !user && !isPublicRoute) {
      router.replace('/');
    }
  }, [isPublicRoute, ready, router, user]);

  if (!isPublicRoute && (!ready || !user)) {
    return null;
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGuard>{children}</AuthGuard>
      </AuthProvider>
    </ThemeProvider>
  );
}
