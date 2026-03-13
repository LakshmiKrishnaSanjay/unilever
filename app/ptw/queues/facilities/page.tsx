'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function FacilitiesPTWQueuePage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to existing facilities review page
    router.replace('/facilities/review');
  }, [router]);

  return null;
}
