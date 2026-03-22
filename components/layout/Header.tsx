'use client';

import { Bell, Menu } from 'lucide-react';
import Avatar from './Avatar';
import { getSession } from '@/lib/auth';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const session = getSession();
  return (
    <header className="top-header">
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.2 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button className="btn-icon btn-secondary btn" data-tooltip="Notifications">
          <Bell size={17} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Avatar name={session?.name || '?'} size="sm" />
          <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{session?.name}</span>
        </div>
      </div>
    </header>
  );
}
