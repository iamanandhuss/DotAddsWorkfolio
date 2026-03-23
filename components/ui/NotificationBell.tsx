'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, Clock } from 'lucide-react';
import { getNotifications, markNotificationRead } from '@/lib/store';
import { getSession } from '@/lib/auth';
import type { AppNotification } from '@/types';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const session = getSession();

  const load = async () => {
    if (session) {
      const data = await getNotifications(session.userId);
      setNotifications(data);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    load();
  };

  const handleMarkAllRead = async () => {
    for (const n of notifications.filter(x => !x.isRead)) {
      await markNotificationRead(n.id);
    }
    load();
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        className="btn btn-icon btn-secondary" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: 'relative' }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -2,
            right: -2,
            background: 'var(--red)',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--bg-card)'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="card shadow-lg" style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '0.75rem',
          width: '320px',
          maxHeight: '400px',
          overflowY: 'auto',
          zIndex: 1000,
          padding: 0,
          border: '1px solid var(--border)'
        }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Notifications</h4>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} style={{ fontSize: '0.75rem', color: 'var(--brand-500)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                Mark all read
              </button>
            )}
          </div>
          <div style={{ padding: '0.5rem 0' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No notifications yet.
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} style={{ 
                  padding: '0.875rem 1rem', 
                  borderBottom: '1px solid var(--border-light',
                  background: n.isRead ? 'transparent' : 'rgba(var(--brand-500-rgb), 0.04)',
                  display: 'flex',
                  gap: '0.75rem',
                  position: 'relative'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{n.title}</span>
                      {!n.isRead && (
                        <button 
                          onClick={() => handleMarkRead(n.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--brand-500)', cursor: 'pointer', padding: 2 }}
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{n.message}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <Clock size={12} />
                      {new Date(n.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
