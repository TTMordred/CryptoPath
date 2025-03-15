'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AuthCheck({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    useEffect(() => {
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser && window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
            router.push('/login');
        }
    }, [router]);

    return <>{children}</>;
}