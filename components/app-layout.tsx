'use client';

import React from "react"

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useWorkflow } from '@/lib/use-workflow';
import { AppSidebar } from './app-sidebar';
import { AppHeader } from './app-header';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useWorkflow();
  const pathname = usePathname();
  const router = useRouter();

  // Auth check - redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser && !pathname?.startsWith('/auth')) {
      router.push('/auth/login');
    }
  }, [currentUser, pathname, router]);

  // Don't show layout on auth pages
  if (pathname?.startsWith('/auth')) {
    return <>{children}</>;
  }

  // Don't render if no user (while redirecting)
  if (!currentUser) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7FAFC]">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
