'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CoERootRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/coe/overview');
  }, [router]);
  return null;
}
