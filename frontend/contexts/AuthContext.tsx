'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { Permission, User } from '@/types';
import { rolePermissions } from '@/types';
import { auth, fetchUserProfileById, firebaseSignIn, firebaseSignOut, normalizeRole, type FirestoreUserProfile } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  ready: boolean;
  hasPermission: (feature: string, access: 'read' | 'write') => boolean;
  signIn: (email: string, password: string) => Promise<User | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const storageKey = 'centific-user';

const normalizeUserProfile = (
  profile: (FirestoreUserProfile & { id: string }) | User | null,
  fallbackEmail = ''
): User | null => {
  if (!profile) {
    return null;
  }

  const role = normalizeRole('role' in profile && profile.role ? profile.role : 'roles' in profile ? profile.roles : undefined);

  if (!role || !profile.name) {
    return null;
  }

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email || fallbackEmail,
    role,
    avatar: 'avatar' in profile ? profile.avatar : undefined,
  };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setReady(true);
        return;
      }

      const loadUserProfile = async () => {
        const firestoreProfile = await fetchUserProfileById(firebaseUser.uid);
        const firestoreUser = normalizeUserProfile(firestoreProfile, firebaseUser.email ?? '');
        if (firestoreUser) {
          setUser(firestoreUser);
          setReady(true);
          return;
        }

        setUser(null);
        setReady(true);
      };

      void loadUserProfile();
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem(storageKey, JSON.stringify(user));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [user]);

  const signIn = async (email: string, password: string) => {
    setReady(false);
    const normalizedEmail = email.trim().toLowerCase();
    const credential = await firebaseSignIn(normalizedEmail, password);
    const firestoreProfile = await fetchUserProfileById(credential.user.uid);
    const signedInUser = normalizeUserProfile(firestoreProfile, credential.user.email ?? normalizedEmail);

    setUser(signedInUser);
    setReady(true);
    return signedInUser;
  };

  const signOut = async () => {
    await firebaseSignOut();
    setUser(null);
    setReady(true);
  };

  const hasPermission = (feature: string, access: 'read' | 'write') => {
    if (!user) return false;
    const permissions: Permission[] = rolePermissions[user.role] ?? [];
    const permission = permissions.find((item) => item.feature === feature);
    return access === 'read' ? Boolean(permission?.read) : Boolean(permission?.write);
  };

  const value: AuthContextType = {
    user,
    setUser,
    ready,
    hasPermission,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
