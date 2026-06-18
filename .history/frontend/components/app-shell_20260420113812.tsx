'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Menu, Moon, Sun, LogOut, UserCircle, LayoutDashboard, FileText, Sparkles, Briefcase, Users, UserCheck, Calendar, ClipboardList, CheckSquare, UserCog, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export type AppNavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  feature?: string;
};

const defaultNavItems: AppNavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Resume Parsing', href: '/resume-parsing', icon: FileText, feature: 'Resume Parsing' },
  { title: 'AI Matching', href: '/ai-matching', icon: Sparkles, feature: 'AI Matching' },
  { title: 'Job Positions', href: '/job-positions', icon: Briefcase, feature: 'Job Positions' },
  { title: 'Talent Pool', href: '/talent-pool', icon: Users, feature: 'Searchable Talent Pool' },
  { title: 'Shortlisted Pool', href: '/shortlisted-pool', icon: UserCheck, feature: 'Shortlisted Pool' },
  { title: 'Interviews', href: '/interviews', icon: Calendar, feature: 'Interview Management' },
  { title: 'Candidate Profiles', href: '/candidate-profiles', icon: ClipboardList, feature: 'Candidate Profiles' },
  { title: 'Hiring Matrix', href: '/hiring-matrix', icon: CheckSquare, feature: 'Hiring Matrix Approval' },
  { title: 'User Management', href: '/users', icon: UserCog, feature: 'User Management' },
  { title: 'Profile Management', href: '/profile', icon: UserCircle },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hasPermission, signOut, switchRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const hiddenForSuperAdmin = new Set([
    '/dashboard',
    '/resume-parsing',
    '/ai-matching',
    '/job-positions',
    '/talent-pool',
    '/shortlisted-pool',
    '/interviews',
    '/candidate-profiles',
    '/hiring-matrix',
  ]);

  const navItems = defaultNavItems.filter((item) => {
    if (user?.role === 'Super Admin' && hiddenForSuperAdmin.has(item.href)) {
      return false;
    }
    if (!item.feature) return true;
    return hasPermission(item.feature, 'read');
  });

  const handleLogout = () => {
    signOut();
    router.push('/');
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-card">
      <div className="flex h-16 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-3">
          <img src="/images/centificlogo.png" alt="Centific" className="h-8 w-auto mix-blend-multiply dark:mix-blend-normal dark:brightness-0 dark:invert" />
        </div>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(false)}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <nav className="space-y-1 p-3">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Button key={item.href} asChild variant={active ? 'default' : 'ghost'} className="h-auto w-full justify-start px-3 py-3">
                <Link href={item.href} onClick={() => setOpen(false)}>
                  <item.icon className="mr-3 h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{user ? getInitials(user.name) : 'C'}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name ?? 'Guest User'}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.role ?? 'Role'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-72 shrink-0 border-r border-border lg:block">
        <SidebarContent />
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="fixed left-4 top-4 z-40 lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="lg:hidden" />
            <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Centific Talent Management</span>
              <Separator orientation="vertical" className="h-4" />
              <span>{user?.role ?? 'Guest'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Switch Role (Demo)
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(['Recruiter', 'Hiring Manager', 'Department Manager', 'Super Admin'] as const).map((role) => (
                  <DropdownMenuItem key={role} onClick={() => switchRole(role)}>
                    {role}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{user ? getInitials(user.name) : 'C'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{user?.name ?? 'Guest User'}</p>
                    <p className="text-xs text-muted-foreground">{user?.email ?? 'Not signed in'}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
