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
import type { Contractor } from '@/lib/types';
import { workflowStore } from '@/lib/workflow-store';

type FormState = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  is_active: boolean;
  password: string; // only used when creating a contractor login
};

export default function ContractorsManagementPage() {
  useEffect(() => {
    workflowStore.syncFromDatabase();
  }, []);

  const { contractors = [], currentUser } = useWorkflow();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);

  const [formData, setFormData] = useState<FormState>({
    companyName: '',
    contactName: '',
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

  const filteredContractors = contractors.filter((contractor) => {
    const matchesSearch =
      contractor.companyName.toLowerCase().includes(search.toLowerCase()) ||
      contractor.contactName.toLowerCase().includes(search.toLowerCase()) ||
      (contractor.email && contractor.email.toLowerCase().includes(search.toLowerCase())) ||
      (contractor.phone && contractor.phone.toLowerCase().includes(search.toLowerCase()));

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'active' && contractor.is_active) ||
      (filterStatus === 'inactive' && !contractor.is_active);

    return matchesSearch && matchesFilter;
  });

  const handleOpenDialog = (contractor?: Contractor) => {
    if (contractor) {
      setEditingContractor(contractor);
      setFormData({
        companyName: contractor.companyName,
        contactName: contractor.contactName,
        email: contractor.email || '',
        phone: contractor.phone || '',
        is_active: contractor.is_active,
        password: '', // always blank while editing
      });
    } else {
      setEditingContractor(null);
      setFormData({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        is_active: true,
        password: '', // reset
      });
    }

    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.companyName || !formData.contactName) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Password required only for new contractor WITH email (login account)
    if (!editingContractor && formData.email && !formData.password) {
      toast.error('Please enter a password for the contractor login');
      return;
    }

    setSaving(true);

    try {
      if (editingContractor) {
        // don’t send password on update
        const { password, ...updatePayload } = formData;

        const result = await workflowStore.updateContractor(editingContractor.id, updatePayload as any);
        if (result.success) {
          toast.success('Contractor updated successfully');
          setDialogOpen(false);
        } else {
          toast.error(result.error || 'Failed to update contractor');
        }
      } else {
        const result = await workflowStore.addContractor(formData as any);
        if (result.success) {
          toast.success('Contractor created successfully');
          setDialogOpen(false);
        } else {
          toast.error(result.error || 'Failed to create contractor');
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (contractorId: string) => {
    const result = await workflowStore.toggleContractorActive(contractorId);
    if (result.success) {
      toast.success('Contractor status updated');
    } else {
      toast.error(result.error || 'Failed to update contractor status');
    }
  };

  const handleDelete = async (contractorId: string) => {
    if (confirm('Are you sure you want to delete this contractor?')) {
      const result = await workflowStore.deleteContractor(contractorId);
      if (result.success) {
        toast.success('Contractor deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete contractor');
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Contractors Management</h1>
            <p className="text-muted-foreground">Manage contractor companies and contacts</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Contractor
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by company, contact, email, or phone..."
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
                  <SelectItem value="all">All Contractors</SelectItem>
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
                  <TableHead>Company Name</TableHead>
                  <TableHead>Contact Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContractors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No contractors found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContractors.map((contractor) => (
                    <TableRow key={contractor.id}>
                      <TableCell className="font-medium">{contractor.companyName}</TableCell>
                      <TableCell>{contractor.contactName}</TableCell>
                      <TableCell>{contractor.email || '-'}</TableCell>
                      <TableCell>{contractor.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={contractor.is_active ? 'default' : 'secondary'}>
                          {contractor.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleOpenDialog(contractor)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={contractor.is_active ? 'secondary' : 'default'}
                            onClick={() => handleToggleActive(contractor.id)}
                          >
                            {contractor.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
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
            <DialogTitle>{editingContractor ? 'Edit Contractor' : 'Add New Contractor'}</DialogTitle>
            <DialogDescription>
              {editingContractor ? 'Update contractor information' : 'Create a new contractor record'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Enter company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name *</Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                placeholder="Enter contact person name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@company.com"
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

            {!editingContractor && (
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