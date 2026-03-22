'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Sidebar from '@/components/layout/Sidebar';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== 'employee') router.replace('/login');
  }, [router]);

  return (
    <div className="app-shell">
      <Sidebar role="employee" />
      <div className="main-content">{children}</div>
    </div>
  );
}
