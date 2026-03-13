'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWorkflow } from '@/lib/use-workflow';
import { Plus, Search, Pencil, Check, X } from 'lucide-react';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { User, Role } from '@/lib/types';
import { workflowStore } from '@/lib/workflow-store';

const roleOptions: { value: Role; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'hse_manager', label: 'HSE Manager' },
  { value: 'facilities', label: 'Facilities' },
  { value: 'efs', label: 'EFS' },
  { value: 'security', label: 'Security' },
  { value: 'stakeholder', label: 'Stakeholder' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'contractor_admin', label: 'Contractor Admin' },
  { value: 'contractor_supervisor', label: 'Contractor Supervisor' },
  { value: 'viewer', label: 'Viewer' },
];

type FormState = {
  username: string;
  name: string;
  email: string;
  role: Role;
  is_active: boolean;
  password: string; // only used when creating a new user
};

export default function UsersManagementPage() {
  const { users = [], currentUser } = useWorkflow();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState<FormState>({
    username: '',
    name: '',
    email: '',
    role: 'viewer',
    is_active: true,
    password: '',
  });

  const [saving, setSaving] = useState(false);

  // Check authorization (UI-only guard)
  if (currentUser?.role !== 'super_admin') {
    return (
      <DashboardLayout>
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">You do not have permission to access this page.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.username.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.is_active) ||
      (filterStatus === 'inactive' && !user.is_active);

    return matchesSearch && matchesFilter;
  });

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        password: '', // keep empty while editing
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        name: '',
        email: '',
        role: 'viewer',
        is_active: true,
        password: '', // reset
      });
    }

    setDialogOpen(true);
  };

  const handleSave = async () => {
    // Required fields
    if (!formData.name || !formData.email || !formData.username) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Password required only for new users
    if (!editingUser && !formData.password) {
      toast.error('Please enter a password for the new user');
      return;
    }

    setSaving(true);

    try {
      if (editingUser) {
        // Do NOT send password on update
        const { password, ...updatePayload } = formData;

        const result = await workflowStore.updateUser(editingUser.id, updatePayload as any);
        if (result.success) {
          toast.success('User updated successfully');
          setDialogOpen(false);
        } else {
          toast.error(result.error || 'Failed to update user');
        }
      } else {
        // Create (includes password)
        const result = await workflowStore.addUser(formData as any);
        if (result.success) {
          toast.success('User created successfully');
          setDialogOpen(false);
        } else {
          toast.error(result.error || 'Failed to create user');
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (userId: string) => {
    const result = await workflowStore.toggleUserActive(userId);
    if (result.success) {
      toast.success('User status updated');
    } else {
      toast.error(result.error || 'Failed to update user status');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Users Management</h1>
            <p className="text-muted-foreground">Manage system users and permissions</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or username..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={filterStatus} onValueChange={(val: any) => setFilterStatus(val)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {roleOptions.find((r) => r.value === user.role)?.label || user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleOpenDialog(user)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={user.is_active ? 'secondary' : 'default'}
                            onClick={() => handleToggleActive(user.id)}
                          >
                            {user.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update user information and permissions' : 'Create a new user account'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="username"
              />
            </div>

            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="new_password">Password *</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create a password"
                  autoComplete="new-password"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(val: Role) => setFormData({ ...formData, role: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Active
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}