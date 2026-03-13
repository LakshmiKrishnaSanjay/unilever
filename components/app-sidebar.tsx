'use client';

import React from "react"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  Users,
  Settings,
  Shield,
  CheckCircle,
  Activity,
  BarChart3,
  HelpCircle,
  UserCircle,
  FileCheck,
  Upload,
  Eye,
  Building,
  Database,
  ListChecks,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkflow } from '@/lib/use-workflow';
import type { Role } from '@/lib/types';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const roleNavigations: Record<Role, NavItem[]> = {
  super_admin: [
    { title: 'Dashboard', href: '/dashboard/super_admin', icon: LayoutDashboard },
    { title: 'Users', href: '/super_admin/users', icon: Users },
    { title: 'Contractors', href: '/super_admin/contractors', icon: Building },
    { title: 'Stakeholders', href: '/super_admin/stakeholders', icon: Users },
    { title: 'Supervisor Requests', href: '/super_admin/supervisor-requests', icon: UserPlus  },
    { title: 'All MOCs', href: '/moc', icon: FileText },
    { title: 'All PTWs', href: '/permits', icon: FileCheck },
    { title: 'System Settings', href: '/super_admin/settings', icon: Settings },
  ],
  hse_manager: [
    { title: 'Dashboard', href: '/hse/dashboard', icon: LayoutDashboard },
    { title: 'MOCs', href: '/moc', icon: FileText },
    { title: 'MOC Review', href: '/hse/moc-review', icon: ClipboardCheck },
    { title: 'PTW Review', href: '/hse/ptw-review', icon: FileCheck },
    { title: 'Progress Logs', href: '/hse/progress', icon: ListChecks },
    { title: 'Job Closure', href: '/hse/closure', icon: CheckCircle },
    { title: 'Reports', href: '/reports', icon: BarChart3 },
    { title: 'Activity Log', href: '/activity', icon: Activity },
  ],
  stakeholder: [
    { title: 'Dashboard', href: '/stakeholder/dashboard', icon: LayoutDashboard },
    { title: 'MOC Sign-off', href: '/stakeholder/moc-review', icon: ClipboardCheck },
    { title: 'MOCs', href: '/moc', icon: FileCheck },
    { title: 'Closure Review', href: '/stakeholder/closure', icon: CheckCircle },
  ],
  facilities: [
    { title: 'Dashboard', href: '/facilities/dashboard', icon: LayoutDashboard },
    { title: 'MOC Review', href: '/facilities/moc-review', icon: FileText },
    { title: 'MOCs', href: '/moc', icon: FileCheck },
    { title: 'PTW Review', href: '/facilities/review', icon: ClipboardCheck },
    { title: 'Closure Review', href: '/facilities/closure', icon: CheckCircle },
  ],
  efs: [
    { title: 'Dashboard', href: '/efs/dashboard', icon: LayoutDashboard },
    { title: 'PTW Review', href: '/efs/review', icon: ClipboardCheck },
    { title: 'Closure Review', href: '/efs/closure', icon: CheckCircle },
  ],
  security: [
    { title: 'Dashboard', href: '/security/dashboard', icon: LayoutDashboard },
    { title: 'PTW Review', href: '/security/review', icon: ClipboardCheck },
    { title: 'Check-in', href: '/security/checkin', icon: Shield },
    { title: 'Progress Logs', href: '/security/progress', icon: ListChecks },
  ],
  supervisor: [
    { title: 'Dashboard', href: '/supervisor/dashboard', icon: LayoutDashboard },
    { title: 'Active PTWs', href: '/permits', icon: FileCheck },
    { title: 'Close Job', href: '/supervisor/close-job', icon: CheckCircle },
  ],
  contractor_admin: [
    { title: 'Dashboard', href: '/contractor/dashboard', icon: LayoutDashboard },
    { title: 'My MOCs', href: '/moc', icon: FileText },
    { title: 'My PTWs', href: '/permits', icon: FileCheck },
    { title: 'Create PTW', href: '/permits/new', icon: Upload },
  ],
  contractor_supervisor: [
    { title: 'Dashboard', href: '/contractor-supervisor/dashboard', icon: LayoutDashboard },
    { title: 'Progress Logs', href: '/contractor-supervisor/progress', icon: ListChecks },
  ],
  viewer: [
    { title: 'Dashboard', href: '/viewer/dashboard', icon: LayoutDashboard },
    { title: 'View MOCs', href: '/moc', icon: FileText },
    { title: 'View PTWs', href: '/permits', icon: FileCheck },
    { title: 'Reports', href: '/reports', icon: BarChart3 },
  ],
};

const bottomLinks: NavItem[] = [
  { title: 'Profile Settings', href: '/profile/settings', icon: UserCircle },
  { title: 'Data Import/Export', href: '/settings/data', icon: Database },
  { title: 'Help & Support', href: '/help', icon: HelpCircle },
];

export function AppSidebar() {
  const { currentUser } = useWorkflow();
  const pathname = usePathname();

  if (!currentUser) return null;

  const navigation = roleNavigations[currentUser.role] || [];

  return (
    <div className="flex h-screen w-64 flex-col bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))]">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-[hsl(var(--sidebar-border))] px-6">
        <img 
          src="/unilever-logo-white.svg" 
          alt="Unilever" 
          className="h-8 w-auto"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const is_active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                is_active
                  ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]'
                  : 'text-[hsl(var(--sidebar-foreground))]/80 hover:bg-[hsl(var(--sidebar-accent))]/50 hover:text-[hsl(var(--sidebar-foreground))]'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Links */}
      <div className="border-t border-[hsl(var(--sidebar-border))] px-3 py-4">
        {bottomLinks.map((item) => {
          const Icon = item.icon;
          const is_active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                is_active
                  ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]'
                  : 'text-[hsl(var(--sidebar-foreground))]/80 hover:bg-[hsl(var(--sidebar-accent))]/50 hover:text-[hsl(var(--sidebar-foreground))]'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </div>

      {/* User Info */}
      <div className="border-t border-[hsl(var(--sidebar-border))] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
            <UserCircle className="h-6 w-6" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{currentUser.name}</p>
            <p className="truncate text-xs text-[hsl(var(--sidebar-foreground))]/60">
              {currentUser.role.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
