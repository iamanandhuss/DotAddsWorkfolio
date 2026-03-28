'use client';

import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Avatar from './Avatar';
import NotificationBell from '../ui/NotificationBell';
import { getSession } from '@/lib/auth';
import type { AuthSession } from '@/types';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  useEffect(() => { setSession(getSession()); }, []);
  return (
    <header className="top-header">
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.2 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: '0.5rem', marginRight: '1rem' }}>{actions}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <NotificationBell />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Avatar name={session?.name || '?'} size="sm" />
          <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{session?.name}</span>
        </div>
      </div>
    </header>
  );
}
