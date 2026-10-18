'use client';

import { useEffect, useState } from 'react';
import { Edit, Trash2, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  createUserAccount,
  deleteUserAccount,
  normalizeRole,
  subscribeToUsersCollection,
  upsertUserProfile,
  type FirestoreUserProfile,
} from '@/lib/firebase';
import type { Role, User } from '@/types';

type UserFormState = {
  name: string;
  email: string;
  role: Role;
  password: string;
  confirmPassword: string;
};

function normalizeUserRecord(record: FirestoreUserProfile & { id: string }): User | null {
  const role = normalizeRole(record.role ?? record.roles);
  if (!record.name || !record.email || !role) {
    return null;
  }

  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role,
  };
}

export function UserManagement() {
  const { hasPermission, ready, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<UserFormState>({
    name: '',
    email: '',
    role: 'Recruiter',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!currentUser) {
      return;
    }

    const unsubscribe = subscribeToUsersCollection((records) => {
      setUsers(records.map(normalizeUserRecord).filter((record): record is User => Boolean(record)));
      setLoadingUsers(false);
    });

    return () => unsubscribe();
  }, [currentUser, ready]);

  const resetForm = () => {
    setNewUser({
      name: '',
      email: '',
      role: 'Recruiter',
      password: '',
      confirmPassword: '',
    });
    setFormMode('create');
    setEditingUserId(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (selectedUser: User) => {
    setFormMode('edit');
    setEditingUserId(selectedUser.id);
    setNewUser({
      name: selectedUser.name,
      email: selectedUser.email,
      role: selectedUser.role,
      password: '',
      confirmPassword: '',
    });
    setDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!newUser.name || !newUser.email) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (formMode === 'create' && newUser.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (formMode === 'create' && newUser.password !== newUser.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const payload: FirestoreUserProfile = {
        name: newUser.name,
        email: newUser.email,
        roles: newUser.role,
      };

      if (formMode === 'edit' && editingUserId) {
        await upsertUserProfile(editingUserId, payload);
        toast.success('User updated successfully');
      } else {
        await createUserAccount({
          name: newUser.name,
          email: newUser.email, 
          password: newUser.password,
          role: newUser.role,
        });
        toast.success('User added successfully');
      }

      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save user:', error);
      toast.error('Failed to save user');
    }
  };

  const handleRemoveUser = async (selectedUser: User) => {
    if (selectedUser.id === currentUser?.id) {
      toast.error('You cannot remove your own account');
      return;
    }

    try {
      await deleteUserAccount(selectedUser.id, selectedUser.email);
      setUserToDelete(null);
      toast.success('User removed successfully');
    } catch (error) {
      console.error('Failed to remove user:', error);
      toast.error('Failed to remove user');
    }
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <p className="text-muted-foreground">Loading user access...</p>
      </div>
    );
  }

  if (!hasPermission('User Management', 'read')) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">You don&apos;t have permission to access this feature.</p>
      </div>
    );
  }

  const canWrite = hasPermission('User Management', 'write');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage user accounts and roles</p>
        </div>
        {canWrite && (
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                resetForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{formMode === 'edit' ? 'Edit User' : 'Add New User'}</DialogTitle>
                <DialogDescription>
                  {formMode === 'edit'
                    ? 'Update the user profile and role'
                    : 'Create a new user account and assign a role'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@centific.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
                {formMode === 'create' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="At least 6 characters"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Re-enter the password"
                        value={newUser.confirmPassword}
                        onChange={(e) =>
                          setNewUser({ ...newUser, confirmPassword: e.target.value })
                        }
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) => setNewUser({ ...newUser, role: value as Role })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Recruiter">Recruiter</SelectItem>
                      <SelectItem value="Hiring Manager">Hiring Manager</SelectItem>
                      <SelectItem value="Department Manager">Department Manager</SelectItem>
                      <SelectItem value="Super Admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveUser} disabled={!newUser.name || !newUser.email}>
                  {formMode === 'edit' ? 'Save Changes' : 'Add User'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {!ready || loadingUsers ? (
            <p className="py-6 text-sm text-muted-foreground">Loading users...</p>
          ) : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                {canWrite && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((rowUser) => (
                <TableRow key={rowUser.id}>
                  <TableCell className="font-medium">{rowUser.name}</TableCell>
                  <TableCell>{rowUser.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{rowUser.role}</Badge>
                  </TableCell>
                  {canWrite && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(rowUser)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUserToDelete(rowUser)}
                          disabled={rowUser.id === currentUser?.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(userToDelete)}
        onOpenChange={(open) => {
          if (!open) {
          setUserToDelete(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
          <DialogTitle>Delete user account?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. The account and user profile for{' '}
            <strong>{userToDelete?.email}</strong> will be permanently removed.
          </DialogDescription>
          </DialogHeader>
          <DialogFooter>
          <Button variant="outline" onClick={() => setUserToDelete(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => userToDelete && void handleRemoveUser(userToDelete)}
          >
            Confirm delete
          </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Permissions Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge variant="outline">Hiring Manager</Badge>
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• View resumes and AI matching</li>
                  <li>• Manage talent pool and profiles</li>
                  <li>• Approve hiring matrix</li>
                  <li>• View interviews</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge variant="outline">Recruiter</Badge>
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Full resume parsing and AI matching</li>
                  <li>• Manage talent pool and interviews</li>
                  <li>• Update candidate profiles</li>
                  <li>• View hiring matrix</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge variant="outline">Department Manager</Badge>
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• View resumes and AI matching</li>
                  <li>• Manage talent pool and profiles</li>
                  <li>• Approve hiring matrix</li>
                  <li>• View interviews</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge variant="outline">Super Admin</Badge>
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• View-only access to all features</li>
                  <li>• Full user management</li>
                  <li>• Add/remove accounts</li>
                  <li>• Assign and modify roles</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
