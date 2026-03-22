'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ensureSeeded } from '@/lib/store';
import { getSession } from '@/lib/auth';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    ensureSeeded();
    const session = getSession();
    if (!session) {
      router.replace('/login');
    } else if (session.role === 'admin') {
      router.replace('/admin');
    } else {
      router.replace('/employee');
    }
  }, [router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner" />
    </div>
  );
}
