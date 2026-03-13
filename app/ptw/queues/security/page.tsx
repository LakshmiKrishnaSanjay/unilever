'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SecurityPTWQueuePage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to existing security review page
    router.replace('/security/review');
  }, [router]);

  return null;
}
