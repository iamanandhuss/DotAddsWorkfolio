'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Sidebar from '@/components/layout/Sidebar';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    const checkSession = () => {
      const session = getSession();
      if (!session || session.role !== 'employee') {
        router.replace('/login');
      }
    };
    
    checkSession();
    
    // Listen for storage changes from other tabs
    window.addEventListener('storage', checkSession);
    return () => window.removeEventListener('storage', checkSession);
  }, [router]);

  return (
    <div className="app-shell">
      <Sidebar role="employee" />
      <div className="main-content">{children}</div>
    </div>
  );
}
