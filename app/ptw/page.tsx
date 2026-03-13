'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PTWPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to /permits (aliasing for compatibility)
    router.replace('/permits');
  }, [router]);

  return null;
}
