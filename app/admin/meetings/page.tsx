'use client';

import { useState, useEffect } from 'react';
import { Plus, LayoutGrid, List as ListIcon, Search } from 'lucide-react';
import Header from '@/components/layout/Header';
import { getMeetings, addMeeting, updateMeeting, deleteMeeting } from '@/lib/store';
import { getSession } from '@/lib/auth';
import type { Meeting, AuthSession } from '@/types';
import MeetingList from '@/components/meetings/MeetingList';
import MeetingForm from '@/components/meetings/MeetingForm';

export default function AdminMeetingsPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | undefined>();
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEm = async () => {
      setSession(getSession());
      const allMeetings = await getMeetings();
      setMeetings(allMeetings);
      setIsLoading(false);
    };
    fetchEm();
  }, []);

  const handleSave = async (meeting: Meeting, participantIds: string[]) => {
    if (editingMeeting) {
      await updateMeeting(meeting, participantIds);
    } else {
      await addMeeting(meeting, participantIds);
    }
    setMeetings(await getMeetings());
  };

  const filteredMeetings = meetings.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase()) || 
    m.description.toLowerCase().includes(search.toLowerCase())
  );

  if (!session) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Header 
        title="Meetings Management" 
        subtitle="Schedule and organize team sync-ups" 
        actions={
          <button onClick={() => { setEditingMeeting(undefined); setIsFormOpen(true); }} className="btn btn-primary">
            <Plus size={18} /> Create Meeting
          </button>
        }
      />
      
      <div className="page-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search meetings..." 
              style={{ paddingLeft: '2.5rem' }} 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>Loading meetings...</div>
        ) : (
          <MeetingList 
            meetings={filteredMeetings} 
            isAdmin={true} 
            onEdit={(m) => { setEditingMeeting(m); setIsFormOpen(true); }}
            onDelete={async (id) => { await deleteMeeting(id); setMeetings(await getMeetings()); }}
          />
        )}
      </div>

      {isFormOpen && (
        <MeetingForm 
          meeting={editingMeeting} 
          currentUser={session} 
          onClose={() => setIsFormOpen(false)} 
          onSave={handleSave} 
        />
      )}
    </div>
  );
}
