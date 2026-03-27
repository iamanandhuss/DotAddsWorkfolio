'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/layout/Header';
import { TaskStatusBadge, PriorityBadge } from '@/components/ui/Badges';
import { getTasksByUser, updateTask, getTaskUpdates, addTaskUpdate, generateId } from '@/lib/store';
import { getSession } from '@/lib/auth';
import type { Task, TaskStatus, TaskUpdate } from '@/types';
import { 
  CheckCircle2, AlertCircle, ClipboardList, Info, 
  Send, History, MessageSquare, Clock, User as UserIcon
} from 'lucide-react';

export default function TaskUpdationsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [updates, setUpdates] = useState<TaskUpdate[]>([]);
  const [note, setNote] = useState<string>('');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingUpdates, setFetchingUpdates] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadTasks = async () => {
    const session = getSession();
    if (session) {
      const data = await getTasksByUser(session.userId);
      setTasks(data);
    }
  };

  const loadUpdates = async (taskId: string) => {
    setFetchingUpdates(true);
    try {
      const data = await getTaskUpdates(taskId);
      setUpdates(data);
    } catch (err) {
      console.error('Failed to load updates:', err);
    } finally {
      setFetchingUpdates(false);
    }
  };

  useEffect(() => { 
    loadTasks(); 
    const interval = setInterval(() => {
      loadTasks();
      if (selectedTaskId) loadUpdates(selectedTaskId);
    }, 20000);
    return () => clearInterval(interval);
  }, [selectedTaskId]);

  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  useEffect(() => {
    if (selectedTaskId) {
      loadUpdates(selectedTaskId);
      if (selectedTask) {
        setStatus(selectedTask.status);
      }
      setMessage(null);
      setNote('');
    }
  }, [selectedTaskId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0; // Newest at top
    }
  }, [updates]);

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !note.trim()) return;

    setLoading(true);
    setMessage(null);
    const session = getSession();
    if (!session) return;

    try {
      const now = new Date().toISOString();
      const updateId = generateId();

      // 1. Add Task Update (Note)
      const newUpdate: TaskUpdate = {
        id: updateId,
        taskId: selectedTask.id,
        userId: session.userId,
        userName: session.name,
        note: note.trim(),
        statusAtUpdate: status,
        createdAt: now,
        type: 'note'
      };

      await addTaskUpdate(newUpdate);

      // 2. Update Task Status if changed
      if (status !== selectedTask.status) {
        await updateTask({
          ...selectedTask,
          status,
          updatedAt: now.split('T')[0]
        });

        // Log status change as a separate event
        await addTaskUpdate({
          id: generateId(),
          taskId: selectedTask.id,
          userId: session.userId,
          userName: session.name,
          note: `Status changed from ${selectedTask.status.toUpperCase()} to ${status.toUpperCase()}`,
          statusAtUpdate: status,
          createdAt: new Date().toISOString(),
          type: 'status_change'
        });
      }

      setMessage({ type: 'success', text: 'Update sent to Admin.' });
      setNote('');
      await loadUpdates(selectedTaskId);
      await loadTasks();
    } catch (err) {
      console.error('Update failed:', err);
      setMessage({ type: 'error', text: 'Failed to send update.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100vh', overflow: 'hidden' }}>
      <Header title="Task Activity Hub" subtitle="Real-time collaboration and progress tracking" />
      
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Task List */}
        <div style={{ 
          width: '320px', 
          borderRight: '1px solid var(--border)', 
          background: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
            <h3 className="flex items-center gap-2 font-semibold text-sm uppercase tracking-wider text-muted">
              <ClipboardList size={16} /> My Assignments
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {tasks.map(task => (
              <button
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className={`nav-item ${selectedTaskId === task.id ? 'active' : ''}`}
                style={{ 
                  width: '100%', 
                  textAlign: 'left', 
                  marginBottom: '12px',
                  padding: '1.25rem',
                  borderRadius: '16px',
                  border: selectedTaskId === task.id ? '2px solid var(--brand-500)' : '1px solid var(--border)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  background: selectedTaskId === task.id ? 'rgba(var(--brand-500-rgb), 0.1)' : 'var(--bg-card)',
                  boxShadow: selectedTaskId === task.id ? '0 0 15px rgba(var(--brand-500-rgb), 0.2)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{task.title}</div>
                <div className="flex items-center justify-between w-full">
                  <TaskStatusBadge status={task.status} />
                  <span className="text-xs text-muted flex items-center gap-1">
                    <Clock size={12} /> {task.deadline}
                  </span>
                </div>
              </button>
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-12 text-muted text-sm px-4">
                No active tasks found in your workflow.
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Task Command Center */}
        <div className="flex-1 flex flex-col relative bg-base glass-dark">
          {!selectedTaskId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <div style={{ 
                width: 96, height: 96, borderRadius: '28px', 
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '2rem', color: 'var(--brand-500)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
              }}>
                <MessageSquare size={48} />
              </div>
              <h2 className="text-2xl font-bold mb-3">Task Room</h2>
              <p className="text-muted max-w-sm leading-relaxed">
                Select a project from the left sidebar to view its interactive timeline and post status updates.
              </p>
            </div>
          ) : (
            <div key={selectedTaskId} className="flex-1 flex flex-col animate-slide-right overflow-hidden">
              
              {/* Task Header info */}
               <div style={{ 
                padding: '2rem 2.5rem', 
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(0,0,0,0.15)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backdropFilter: 'blur(10px)'
              }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>{selectedTask?.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-muted">
                    <span className="flex items-center gap-1"><Clock size={14} /> Due: {selectedTask?.deadline}</span>
                    <span className="flex items-center gap-1"><Info size={14} /> Priority: <PriorityBadge priority={selectedTask?.priority || 'medium'} /></span>
                  </div>
                </div>
                {selectedTask?.status === 'completed' && (
                  <div className="badge badge-green p-2 px-4 flex items-center gap-2">
                    <CheckCircle2 size={16} /> Task Completed
                  </div>
                )}
              </div>

              {/* Activity Feed / Timeline */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-8 flex flex-col gap-6"
                style={{ background: 'var(--bg-base)' }}
              >
                {/* Description block as the first item */}
                <div style={{ 
                  display: 'flex', gap: '1rem', 
                  padding: '1rem', background: 'var(--bg-card)', 
                  borderRadius: '12px', border: '1px solid var(--border)' 
                }}>
                  <div style={{ 
                    width: 32, height: 32, borderRadius: '50%', 
                    background: 'var(--brand-500)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Building2 size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--brand-400)', marginBottom: '0.25rem' }}>TASK OBJECTIVE</div>
                    <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{selectedTask?.description}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-muted">
                  <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                  <div className="text-xs uppercase tracking-widest font-bold flex items-center gap-2">
                    <History size={14} /> Activity Timeline
                  </div>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                </div>

                {/* Compact Scrollable Box for Activity */}
                <div style={{ 
                  maxHeight: '300px', 
                  overflowY: 'auto',
                  padding: '1.5rem',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem'
                }} ref={scrollRef}>
                  {fetchingUpdates ? (
                    <div className="flex justify-center p-8"><div className="spinner"></div></div>
                  ) : updates.length === 0 ? (
                    <div className="text-center py-8 text-muted text-sm italic">
                      No activity recorded yet for this task.
                    </div>
                  ) : (
                    updates.map((upd, idx) => {
                      const isAdmin = upd.userId.includes('admin') || upd.type.includes('reply') || upd.type.includes('admin');
                      const isNewest = idx === 0;
                      return (
                        <div key={upd.id} className="animate-fade-in" style={{ 
                          display: 'flex', gap: '0.85rem',
                          alignItems: 'flex-start',
                          flexDirection: isAdmin ? 'row' : 'row-reverse',
                          opacity: isNewest ? 1 : 0.6, // Highlight newest
                          transform: isNewest ? 'scale(1)' : 'scale(0.98)',
                          transition: 'all 0.3s ease'
                        }}>
                          <div style={{ 
                            width: 32, height: 32, borderRadius: '50%', 
                            background: isAdmin ? 'var(--purple)' : 'var(--brand-500)', 
                            color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: isNewest ? '0 4px 12px rgba(var(--brand-500-rgb), 0.3)' : 'none'
                          }}>
                            {isAdmin ? <Building2 size={14} /> : <UserIcon size={14} />}
                          </div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-start' : 'flex-end' }}>
                            <div className="flex items-baseline gap-2 mb-1" style={{ flexDirection: isAdmin ? 'row' : 'row-reverse' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{upd.userName || 'Admin'}</span>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(upd.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className={`chat-bubble ${isAdmin ? 'chat-bubble-admin' : 'chat-bubble-sent'}`} style={{ fontSize: '0.85rem', padding: '0.6rem 0.9rem' }}>
                              {upd.note}
                              {upd.type === 'status_change' && (
                                <div style={{ marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.7rem' }}>
                                  <strong style={{ opacity: 0.7 }}>STATUS:</strong> {upd.statusAtUpdate.toUpperCase()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Bottom Input Section */}
              <div style={{ 
                padding: '1.5rem 2rem', 
                background: 'var(--bg-surface)', 
                borderTop: '1px solid var(--border)' 
              }}>
                {message && (
                  <div className={`animate-fade-in flex items-center gap-2 mb-4 text-sm font-medium ${message.type === 'error' ? 'text-red' : 'text-green'}`}>
                    {message.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                    {message.text}
                  </div>
                )}
                
                <form onSubmit={handleSubmitUpdate} className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div style={{ flex: 1, position: 'relative' }}>
                      <textarea
                        className="textarea"
                        rows={1}
                        style={{ 
                          resize: 'none', 
                          paddingTop: '0.8rem', 
                          paddingLeft: '1rem', 
                          borderRadius: '16px',
                          minHeight: '52px'
                        }}
                        placeholder="What's the status? Add an update..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        required
                        disabled={loading || selectedTask?.status === 'completed'}
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <select
                        className="select"
                        style={{ width: '130px', borderRadius: '12px', height: '52px' }}
                        value={status}
                        onChange={(e) => setStatus(e.target.value as TaskStatus)}
                        disabled={loading || selectedTask?.status === 'completed'}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                      
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ 
                          height: '52px', width: '52px', 
                          borderRadius: '12px', justifyContent: 'center',
                          padding: 0
                        }}
                        disabled={loading || !note.trim() || selectedTask?.status === 'completed'}
                        title="Send Update"
                      >
                        {loading ? <div className="spinner" style={{ width: 16, height: 16 }}></div> : <Send size={20} />}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

            </div>
          )}
        </div>

      </div>
      <style jsx>{`
        .bg-base { background: var(--bg-base); }
      `}</style>
    </div>
  );
}

// Helper icons specifically for this page
function Building2({ size, color }: { size?: number, color?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} height={size || 24} 
      viewBox="0 0 24 24" fill="none" 
      stroke={color || "currentColor"} strokeWidth="2" 
      strokeLinecap="round" strokeLinejoin="round"
    >
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
      <path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
    </svg>
  );
}
