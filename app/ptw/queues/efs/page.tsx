'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function EFSPTWQueuePage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to existing EFS review page
    router.replace('/efs/review');
  }, [router]);

  return null;
}
