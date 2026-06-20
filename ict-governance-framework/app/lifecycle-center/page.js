'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LifecycleCenterRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/coe/overview');
  }, [router]);
  return <div className="p-8 text-gray-500">Redirecting to Centers of Excellence...</div>;
}
