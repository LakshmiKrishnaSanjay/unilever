'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HSEManagerPTWQueuePage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to existing HSE review page
    router.replace('/hse/review');
  }, [router]);

  return null;
}
