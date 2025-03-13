// components/ClientLayout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser && window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
      router.push('/login');
    }
  }, [router]);

  return <>{children}</>;
}