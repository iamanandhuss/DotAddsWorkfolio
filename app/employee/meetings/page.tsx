'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { getMeetingsByUser } from '@/lib/store';
import { getSession } from '@/lib/auth';
import type { Meeting, AuthSession } from '@/types';
import MeetingList from '@/components/meetings/MeetingList';

export default function EmployeeMeetingsPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEm = async () => {
      const s = getSession();
      if (s) {
        setSession(s);
        const myMeetings = await getMeetingsByUser(s.userId);
        setMeetings(myMeetings);
      }
      setIsLoading(false);
    };
    fetchEm();
  }, []);

  if (!session) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Header 
        title="My Meetings" 
        subtitle="Your scheduled sync-ups and collaborative sessions" 
      />
      
      <div className="page-content">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>Loading meetings...</div>
        ) : (
          <MeetingList 
            meetings={meetings} 
            isAdmin={false} 
          />
        )}
      </div>
    </div>
  );
}
