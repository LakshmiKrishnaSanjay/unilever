'use client';

import React from "react"

import { AuthGuard } from './auth-guard';
import { AppSidebar } from './app-sidebar';
import { AppHeader } from './app-header';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto bg-[hsl(var(--background))] p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
