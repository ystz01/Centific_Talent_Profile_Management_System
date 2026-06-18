import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Role, rolePermissions, Permission } from '../types';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  hasPermission: (feature: string, type: 'read' | 'write') => boolean;
  switchRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUsers: Record<Role, User> = {
  'Hiring Manager': {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@centific.com',
    role: 'Hiring Manager',
  },
  'Recruiter': {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@centific.com',
    role: 'Recruiter',
  },
  'Department Manager': {
    id: '3',
    name: 'Michael Chen',
    email: 'michael.chen@centific.com',
    role: 'Department Manager',
  },
  'Super Admin': {
    id: '4',
    name: 'Admin User',
    email: 'admin@centific.com',
    role: 'Super Admin',
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const hasPermission = (feature: string, type: 'read' | 'write'): boolean => {
    if (!user) return false;

    const permissions = rolePermissions[user.role];
    const permission = permissions.find(p => p.feature === feature);

    if (!permission) return false;

    return type === 'read' ? permission.read : permission.write;
  };

  const switchRole = (role: Role) => {
    setUser(mockUsers[role]);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, hasPermission, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
