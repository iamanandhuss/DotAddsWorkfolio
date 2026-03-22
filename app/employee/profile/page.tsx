'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Avatar from '@/components/layout/Avatar';
import { getUserById } from '@/lib/store';
import { getSession } from '@/lib/auth';
import type { User } from '@/types';
import { Mail, Phone, Calendar, Briefcase, Building } from 'lucide-react';

export default function EmployeeProfilePage() {
  const [profile, setProfile] = useState<User | null>(null);

  useEffect(() => {
    const session = getSession();
    if (session) setProfile(getUserById(session.userId) || null);
  }, []);

  if (!profile) return null;

  const InfoRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Header title="My Profile" subtitle="Manage your personal information" />
      <div className="page-content" style={{ maxWidth: 800 }}>

        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '2rem' }}>
          <Avatar name={profile.name} size="lg" />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>{profile.name}</h2>
            <div style={{ color: 'var(--text-muted)' }}>{profile.position} · {profile.department}</div>
          </div>
          <span className="badge badge-blue" style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>Employee ID: {profile.id.toUpperCase()}</span>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <h3 style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>Contact & Job Details</h3>
          <InfoRow icon={<Mail size={18} />} label="Email Address" value={profile.email} />
          <InfoRow icon={<Phone size={18} />} label="Phone Number" value={profile.phone} />
          <InfoRow icon={<Building size={18} />} label="Department" value={profile.department} />
          <InfoRow icon={<Briefcase size={18} />} label="Position" value={profile.position} />
          <InfoRow icon={<Calendar size={18} />} label="Join Date" value={new Date(profile.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
        </div>

      </div>
    </div>
  );
}
