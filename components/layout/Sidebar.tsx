'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Users, CheckSquare, ClipboardList,
  BarChart2, LogOut, Clock, CalendarDays, FileText,
  Building2
} from 'lucide-react';
import { logout, getSession } from '@/lib/auth';
import type { AuthSession } from '@/types';
import { getInitials, avatarColor } from './Avatar';

interface NavItemDef {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const adminNav: NavItemDef[] = [
  { label: 'Dashboard',   href: '/admin',             icon: <LayoutDashboard size={18} /> },
  { label: 'Employees',   href: '/admin/employees',   icon: <Users size={18} /> },
  { label: 'Tasks',       href: '/admin/tasks',        icon: <CheckSquare size={18} /> },
  { label: 'Attendance',  href: '/admin/attendance',   icon: <Clock size={18} /> },
  { label: 'Leaves',      href: '/admin/leaves',       icon: <CalendarDays size={18} /> },
  { label: 'Reports',     href: '/admin/reports',      icon: <BarChart2 size={18} /> },
];

const employeeNav: NavItemDef[] = [
  { label: 'Dashboard',       href: '/employee',           icon: <LayoutDashboard size={18} /> },
  { label: 'My Tasks',        href: '/employee/tasks',     icon: <ClipboardList size={18} /> },
  { label: 'Task Updations',  href: '/employee/tasks/updations', icon: <CheckSquare size={18} /> },
  { label: 'Attendance',      href: '/employee/attendance',icon: <Clock size={18} /> },
  { label: 'Leave',           href: '/employee/leaves',    icon: <CalendarDays size={18} /> },
  { label: 'Profile',         href: '/employee/profile',   icon: <FileText size={18} /> },
];

interface SidebarProps {
  role: 'admin' | 'employee';
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [session, setSession] = useState<AuthSession | null>(null);
  useEffect(() => { setSession(getSession()); }, []);
  const nav = role === 'admin' ? adminNav : employeeNav;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/admin' || href === '/employee') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div style={{ flexShrink: 0 }}>
          <img 
            src="/dotads_logo.jpeg" 
            alt="DOT ADS Logo" 
            style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} 
          />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2 }}>DOT ADS</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {role === 'admin' ? 'Admin Panel' : 'Employee Portal'}
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Navigation</div>
        {nav.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User info + logout */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 8 }}>
          <div
            className="avatar"
            style={{ background: avatarColor(session?.name || ''), color: '#fff' }}
          >
            {getInitials(session?.name || '?')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {session?.name}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {session?.email}
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary w-full" style={{ justifyContent: 'center', marginTop: 4 }}>
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
