'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Permission, Role, User } from '@/types';
import { mockUsers } from '@/data/mockData';
import { rolePermissions } from '@/types';

type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  hasPermission: (feature: string, access: 'read' | 'write') => boolean;
  switchRole: (role: Role) => void;
  signIn: (email: string, password: string) => User | null;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const storageKey = 'centific-user';

const roleToUser = (role: Role): User | null => {
  return mockUsers.find((user) => user.role === role) ?? null;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setUser(JSON.parse(stored) as User);
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem(storageKey, JSON.stringify(user));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [user]);

  const signIn = (email: string, password: string) => {
    void password;
    const normalizedEmail = email.trim().toLowerCase();
    const signedInUser = mockUsers.find((item) => item.email.toLowerCase() === normalizedEmail) ?? null;
    setUser(signedInUser);
    return signedInUser;
  };

  const signOut = () => {
    setUser(null);
  };

  const switchRole = (role: Role) => {
    const nextUser = roleToUser(role);
    if (nextUser) {
      setUser(nextUser);
    }
  };

  const hasPermission = (feature: string, access: 'read' | 'write') => {
    if (!user) return false;
    const permissions: Permission[] = rolePermissions[user.role] ?? [];
    const permission = permissions.find((item) => item.feature === feature);
    return access === 'read' ? Boolean(permission?.read) : Boolean(permission?.write);
  };

  const value = useMemo<AuthContextType>(() => ({
    user,
    setUser,
    hasPermission,
    switchRole,
    signIn,
    signOut,
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
