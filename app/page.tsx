'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkflow } from '@/lib/use-workflow';

export default function Page() {
  const router = useRouter();
  const { currentUser } = useWorkflow();

  useEffect(() => {
    if (currentUser) {
      // Redirect logged-in users to their dashboard
      const roleDashboards: Record<string, string> = {
        super_admin: '/admin/dashboard',
        hse_manager: '/hse/dashboard',
        stakeholder: '/stakeholder/dashboard',
        facilities: '/facilities/dashboard',
        efs: '/efs/dashboard',
        security: '/security/dashboard',
        supervisor: '/supervisor/dashboard',
        contractor_admin: '/contractor/dashboard',
        contractor_supervisor: '/contractor-supervisor/dashboard',
        viewer: '/viewer/dashboard',
      };
      router.push(roleDashboards[currentUser.role] || '/auth/login');
    } else {
      router.push('/auth/login');
    }
  }, [router, currentUser]);

  return null;
}
