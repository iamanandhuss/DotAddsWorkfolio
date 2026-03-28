import { useState, useEffect } from 'react';
import { X, Sparkles, Send, Loader2, Calendar, Link as LinkIcon, Users, AlignLeft } from 'lucide-react';
import { getUsers, generateId } from '@/lib/store';
import type { User, Meeting } from '@/types';

interface MeetingFormProps {
  meeting?: Meeting;
  onClose: () => void;
  onSave: (meeting: Meeting, selectedParticipantIds: string[]) => Promise<void>;
  currentUser: any;
}

export default function MeetingForm({ meeting, onClose, onSave, currentUser }: MeetingFormProps) {
  const [title, setTitle] = useState(meeting?.title || '');
  const [description, setDescription] = useState(meeting?.description || '');
  const [datetime, setDatetime] = useState(meeting?.datetime?.slice(0, 16) || '');
  const [meetingLink, setMeetingLink] = useState(meeting?.meetingLink || '');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(meeting?.participants || []);
  const [employees, setEmployees] = useState<User[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiSubject, setAiSubject] = useState('');
  const [aiBody, setAiBody] = useState('');
  const [showAiPreview, setShowAiPreview] = useState(false);

  useEffect(() => {
    getUsers().then(users => setEmployees(users.filter(u => u.role === 'employee')));
  }, []);

  const handleToggleParticipant = (userId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleGenerateAI = async () => {
    if (!title) return alert('Please enter a title first');
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/compose-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, datetime, meetingLink })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAiSubject(data.subject);
      setAiBody(data.body);
      setShowAiPreview(true);
    } catch (err: any) {
      alert('AI generation failed: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !datetime) return alert('Title and Date/Time are required');
    
    setIsSaving(true);
    try {
      const newMeeting: Meeting = {
        id: meeting?.id || generateId(),
        title,
        description,
        meetingLink,
        datetime: new Date(datetime).toISOString(),
        createdBy: currentUser.userId,
        createdAt: meeting?.createdAt || new Date().toISOString(),
      };
      
      await onSave(newMeeting, selectedParticipants);

      // If AI preview is shown, send the specialized invite
      if (showAiPreview) {
          await fetch('/api/notify/meeting', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  meetingId: newMeeting.id,
                  title: newMeeting.title,
                  description: newMeeting.description,
                  datetime: newMeeting.datetime,
                  meetingLink: newMeeting.meetingLink,
                  participantIds: selectedParticipants,
                  subject: aiSubject,
                  body: aiBody
              })
          });
      }

      onClose();
    } catch (err: any) {
      alert('Failed to save meeting: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: '600px', width: '95%' }}>
        <div className="modal-header">
          <h2 className="modal-title">{meeting ? 'Edit Meeting' : 'Create New Meeting'}</h2>
          <button onClick={onClose} className="btn-icon btn-secondary"><X size={20} /></button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div className="form-group">
              <label className="form-label"><AlignLeft size={14} /> Title</label>
              <input 
                type="text" 
                className="input" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="E.g., Weekly Sync"
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label"><AlignLeft size={14} /> Description</label>
              <textarea 
                className="textarea" 
                rows={3} 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="What is this meeting about?"
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label"><Calendar size={14} /> Date & Time</label>
                <input 
                  type="datetime-local" 
                  className="input" 
                  value={datetime} 
                  onChange={e => setDatetime(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label"><LinkIcon size={14} /> Meeting Link</label>
                <input 
                  type="url" 
                  className="input" 
                  value={meetingLink} 
                  onChange={e => setMeetingLink(e.target.value)} 
                  placeholder="https://zoom.us/j/..."
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label"><Users size={14} /> Participants</label>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '0.5rem', 
                padding: '1rem', 
                background: 'var(--bg-input)', 
                borderRadius: 'var(--radius-sm)', 
                border: '1px solid var(--border)',
                maxHeight: '150px',
                overflowY: 'auto'
              }}>
                {employees.map(emp => (
                  <div 
                    key={emp.id} 
                    onClick={() => handleToggleParticipant(emp.id)}
                    style={{ 
                      padding: '0.4rem 0.8rem', 
                      borderRadius: 20, 
                      fontSize: '0.8rem', 
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: selectedParticipants.includes(emp.id) ? 'var(--brand-500)' : 'var(--bg-card)',
                      color: selectedParticipants.includes(emp.id) ? '#fff' : 'var(--text-secondary)',
                      border: '1px solid ' + (selectedParticipants.includes(emp.id) ? 'var(--brand-500)' : 'var(--border)')
                    }}
                  >
                    {emp.name}
                  </div>
                ))}
              </div>
            </div>

            {showAiPreview && (
              <div style={{ background: 'rgba(59,130,246,0.05)', padding: '1rem', borderRadius: 10, border: '1px solid var(--brand-200)', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--brand-400)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={14} /> AI Draft Invitation
                  </span>
                  <button type="button" onClick={() => setShowAiPreview(false)} style={{ fontSize: '0.75rem', opacity: 0.6, background: 'none', border: 'none', color: 'var(--text-muted)' }}>Discard</button>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Subject: {aiSubject}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{aiBody}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleGenerateAI} 
                disabled={isGenerating || isSaving}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                Generate with AI
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={isSaving || isGenerating}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                {showAiPreview ? 'Send Invite & Save' : 'Save Meeting'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
