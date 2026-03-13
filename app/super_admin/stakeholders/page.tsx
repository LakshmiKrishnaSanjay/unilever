'use client';

import { useEffect, useState } from 'react';
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
import type { Stakeholder } from '@/lib/types';
import { workflowStore } from '@/lib/workflow-store';

type FormState = {
  name: string;
  department: string;
  email: string;
  phone: string;
  is_active: boolean;
  password: string; // only used on create
};

export default function StakeholdersManagementPage() {
  const { stakeholders = [], currentUser } = useWorkflow();

useEffect(() => {
  workflowStore.syncFromDatabase();
  workflowStore.loadStakeholders();
}, []);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStakeholder, setEditingStakeholder] = useState<Stakeholder | null>(null);

  const [formData, setFormData] = useState<FormState>({
    name: '',
    department: '',
    email: '',
    phone: '',
    is_active: true,
    password: '',
  });

  const [saving, setSaving] = useState(false);
  

  // Check authorization
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

  const filteredStakeholders = stakeholders.filter((stakeholder) => {
    const matchesSearch =
      stakeholder.name.toLowerCase().includes(search.toLowerCase()) ||
      (stakeholder.department && stakeholder.department.toLowerCase().includes(search.toLowerCase())) ||
      (stakeholder.email && stakeholder.email.toLowerCase().includes(search.toLowerCase())) ||
      (stakeholder.phone && stakeholder.phone.toLowerCase().includes(search.toLowerCase()));

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'active' && stakeholder.is_active) ||
      (filterStatus === 'inactive' && !stakeholder.is_active);

    return matchesSearch && matchesFilter;
  });

  const handleOpenDialog = (stakeholder?: Stakeholder) => {
    if (stakeholder) {
      setEditingStakeholder(stakeholder);
      setFormData({
        name: stakeholder.name,
        department: stakeholder.department || '',
        email: stakeholder.email || '',
        phone: stakeholder.phone || '',
        is_active: stakeholder.is_active,
        password: '', // keep blank on edit
      });
    } else {
      setEditingStakeholder(null);
      setFormData({
        name: '',
        department: '',
        email: '',
        phone: '',
        is_active: true,
        password: '',
      });
    }

    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    // If you want stakeholder login, require email + password on create
    if (!editingStakeholder) {
      if (!formData.email) {
        toast.error('Email is required to create stakeholder login');
        return;
      }
      if (!formData.password) {
        toast.error('Please enter a password for the new stakeholder');
        return;
      }
    }

    setSaving(true);

    try {
      if (editingStakeholder) {
        // don’t send password on update
        const { password, ...updatePayload } = formData;

        const result = await workflowStore.updateStakeholder(
          editingStakeholder.id,
          updatePayload as any
        );

        if (result.success) {
          toast.success('Stakeholder updated successfully');
          setDialogOpen(false);
        } else {
          toast.error(result.error || 'Failed to update stakeholder');
        }
      } else {
        // ✅ addStakeholder must create auth + users role stakeholder on server
        const result = await workflowStore.addStakeholder(formData as any);

        if (result.success) {
          toast.success('Stakeholder created successfully');
          setDialogOpen(false);
        } else {
          toast.error(result.error || 'Failed to create stakeholder');
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (stakeholderId: string) => {
    const result = await workflowStore.toggleStakeholderActive(stakeholderId);
    if (result.success) {
      toast.success('Stakeholder status updated');
    } else {
      toast.error(result.error || 'Failed to update stakeholder status');
    }
  };

  const handleDelete = async (stakeholderId: string) => {
    if (confirm('Are you sure you want to delete this stakeholder?')) {
      const result = await workflowStore.deleteStakeholder(stakeholderId);
      if (result.success) {
        toast.success('Stakeholder deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete stakeholder');
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Stakeholders Management</h1>
            <p className="text-muted-foreground">Manage stakeholder departments and contacts</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Stakeholder
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, department, email, or phone..."
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
                  <SelectItem value="all">All Stakeholders</SelectItem>
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
                  <TableHead>Department</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredStakeholders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No stakeholders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStakeholders.map((stakeholder) => (
                    <TableRow key={stakeholder.id}>
                      <TableCell className="font-medium">{stakeholder.name}</TableCell>
                      <TableCell>{stakeholder.department || '-'}</TableCell>
                      <TableCell>{stakeholder.email || '-'}</TableCell>
                      <TableCell>{stakeholder.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={stakeholder.is_active ? 'default' : 'secondary'}>
                          {stakeholder.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleOpenDialog(stakeholder)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={stakeholder.is_active ? 'secondary' : 'default'}
                            onClick={() => handleToggleActive(stakeholder.id)}
                          >
                            {stakeholder.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
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
            <DialogTitle>{editingStakeholder ? 'Edit Stakeholder' : 'Add New Stakeholder'}</DialogTitle>
            <DialogDescription>
              {editingStakeholder ? 'Update stakeholder information' : 'Create a new stakeholder record'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter stakeholder name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Enter department name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="stakeholder@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1-555-0000"
              />
            </div>

            {!editingStakeholder && (
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