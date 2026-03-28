import { useState, useEffect } from 'react';
import { Calendar, Clock, Link as LinkIcon, User, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Meeting, User as UserType } from '@/types';
import { getUsers } from '@/lib/store';
import Avatar from '@/components/layout/Avatar';

interface MeetingListProps {
  meetings: Meeting[];
  onEdit?: (meeting: Meeting) => void;
  onDelete?: (id: string) => void;
  isAdmin: boolean;
}

export default function MeetingList({ meetings, onEdit, onDelete, isAdmin }: MeetingListProps) {
  const [employees, setEmployees] = useState<UserType[]>([]);
  
  useEffect(() => {
    getUsers().then(setEmployees);
  }, []);

  const now = new Date();
  
  const upcoming = meetings.filter(m => new Date(m.datetime) >= now)
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
    
  const past = meetings.filter(m => new Date(m.datetime) < now)
    .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

  const getUserName = (id: string) => employees.find(e => e.id === id)?.name || 'Unknown';

  const MeetingCard = ({ meeting }: { meeting: Meeting }) => {
    const isPast = new Date(meeting.datetime) < now;
    const date = new Date(meeting.datetime);
    
    return (
      <div className="card meeting-card" style={{ 
        opacity: isPast ? 0.8 : 1, 
        borderLeft: '4px solid ' + (isPast ? 'var(--text-muted)' : 'var(--brand-400)'),
        padding: '1.25rem',
        marginBottom: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.25rem' }}>{meeting.title}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={14} /> {date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className={`badge ${isPast ? 'badge-gray' : 'badge-blue'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {isPast ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
            {isPast ? 'Past' : 'Upcoming'}
          </div>
        </div>

        {meeting.description && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {meeting.description.length > 120 ? meeting.description.slice(0, 117) + '...' : meeting.description}
          </p>
        )}

        {meeting.meetingLink && (
          <a 
            href={meeting.meetingLink} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-secondary btn-sm"
            style={{ width: 'fit-content', border: '1px solid var(--border)' }}
          >
            <LinkIcon size={14} /> Join Meeting
          </a>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Participants:</span>
            <div style={{ display: 'flex', marginLeft: '0.25rem' }}>
                {(meeting.participants || []).slice(0, 5).map((pId, i) => (
                    <div key={pId} style={{ marginLeft: i === 0 ? 0 : -8, border: '2px solid var(--bg-card)', borderRadius: '50%' }}>
                        <Avatar name={getUserName(pId)} size="sm" />
                    </div>
                ))}
                {(meeting.participants || []).length > 5 && (
                    <div style={{ marginLeft: -8, width: 20, height: 20, borderRadius: '50%', background: 'var(--bg-hover)', color: 'var(--text-muted)', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-card)' }}>
                        +{(meeting.participants || []).length - 5}
                    </div>
                )}
            </div>
          </div>
          {isAdmin && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => onEdit?.(meeting)} className="btn btn-icon btn-sm" style={{ color: 'var(--brand-400)' }}><ChevronRight size={16} /></button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={18} style={{ color: 'var(--brand-400)' }} /> Upcoming Meetings
        </h2>
        {upcoming.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', background: 'rgba(59,130,246,0.02)' }}>
            No upcoming meetings scheduled.
          </div>
        ) : (
          upcoming.map(m => <MeetingCard key={m.id} meeting={m} />)
        )}
      </div>

      {past.length > 0 && (
        <div style={{ opacity: 0.7 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} style={{ color: 'var(--text-muted)' }} /> Past Meetings
          </h2>
          {past.slice(0, 5).map(m => <MeetingCard key={m.id} meeting={m} />)}
        </div>
      )}
    </div>
  );
}
