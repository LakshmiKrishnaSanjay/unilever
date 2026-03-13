'use client';

import React from "react"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkflow } from '@/lib/use-workflow';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser } = useWorkflow();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !currentUser) {
      router.push('/auth/login');
    }
  }, [currentUser, router, mounted]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  if (!currentUser) {
    return null;
  }

  return <>{children}</>;
}
