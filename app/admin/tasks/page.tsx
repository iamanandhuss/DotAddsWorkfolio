'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Trash2, Send, MessageSquare, History, User as UserIcon, CheckCircle2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Avatar from '@/components/layout/Avatar';
import Modal from '@/components/ui/Modal';
import { TaskStatusBadge, PriorityBadge } from '@/components/ui/Badges';
import { getTasks, getUsers, addTask, updateTask, deleteTask, generateId, getTaskUpdates, addTaskUpdate, getNotifications, markNotificationRead } from '@/lib/store';
import { getSession } from '@/lib/auth';
import type { Task, TaskStatus, TaskPriority, User, TaskUpdate, AppNotification } from '@/types';

const STATUSES: TaskStatus[] = ['pending', 'in-progress', 'completed'];
const STATUS_LABELS: Record<TaskStatus, string> = { pending: 'Pending', 'in-progress': 'In Progress', completed: 'Completed' };
const STATUS_COLORS: Record<TaskStatus, string> = { pending: 'var(--yellow)', 'in-progress': 'var(--brand-400)', completed: 'var(--green)' };

export default function TasksPage() {
  const session = getSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [viewTask, setViewTask] = useState<Task | null>(null);
  const [updates, setUpdates] = useState<TaskUpdate[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [adminNote, setAdminNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);
  const [notifying, setNotifying] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', priority: 'medium' as TaskPriority, deadline: '' });
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = async () => { 
    setTasks(await getTasks()); 
    if (session) setNotifications(await getNotifications(session.userId));
    if (viewTask) getTaskUpdates(viewTask.id).then(setUpdates);
  };
  useEffect(() => {
    load();
    const interval = setInterval(load, 20000); // Polling for updates
    const fetchUsers = async () => {
      const u = await getUsers();
      setEmployees(u.filter(user => user.role === 'employee'));
    };
    fetchUsers();
    return () => clearInterval(interval);
  }, [session?.userId]);

  useEffect(() => {
    if (viewTask) {
      getTaskUpdates(viewTask.id).then(setUpdates);
      setAdminNote('');
      // Mark related notifications as read
      const unreadForTask = notifications.filter(n => !n.isRead && n.message.includes(viewTask.title));
      unreadForTask.forEach(n => markNotificationRead(n.id));
    }
  }, [viewTask, notifications.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0; // Newest at top
    }
  }, [updates]);

  const filtered = tasks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    employees.find(e => e.id === t.assignedTo)?.name.toLowerCase().includes(search.toLowerCase())
  );

  const byStatus = (status: TaskStatus) => filtered.filter(t => t.status === status);

  const handleAddTask = async () => {
    if (!form.title || !form.assignedTo || !form.deadline || isAdding) return;
    setIsAdding(true);
    try {
      const now = new Date().toISOString().split('T')[0];
      await addTask({
        id: generateId(),
        title: form.title,
        description: form.description,
        assignedTo: form.assignedTo,
        assignedBy: session?.userId || 'u1',
        status: 'pending',
        priority: form.priority,
        deadline: form.deadline,
        createdAt: now,
        updatedAt: now,
      });
      setShowAdd(false);
      setForm({ title: '', description: '', assignedTo: employees[0]?.id || '', priority: 'medium', deadline: '' });
      load();
    } finally {
      setIsAdding(false);
    }
  };

  const handleAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewTask || !adminNote.trim() || !session) return;
    
    setIsUpdating(true);
    try {
      const now = new Date().toISOString();
      const newUpdate: TaskUpdate = {
        id: generateId(),
        taskId: viewTask.id,
        userId: session.userId,
        userName: session.name,
        note: adminNote.trim(),
        statusAtUpdate: viewTask.status,
        createdAt: now,
        type: 'admin_note'
      };

      await addTaskUpdate(newUpdate);
      setAdminNote('');
      setUpdates(await getTaskUpdates(viewTask.id));
    } catch (err) {
      console.error('Failed to add admin note:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const changeStatus = async (task: Task, status: TaskStatus) => {
    await updateTask({ ...task, status, updatedAt: new Date().toISOString().split('T')[0] });
    load();
  };

  const handleDelete = async () => {
    if (confirmDelete) { await deleteTask(confirmDelete.id); setConfirmDelete(null); load(); }
  };
  
  const handleNotify = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setNotifying(task.id);
    try {
      const res = await fetch('/api/notify/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id })
      });
      if (res.ok) alert('Email AI Notification sent successfully!');
      else alert('Failed to send notification. Please check console.');
    } catch {
      alert('Network error while notifying.');
    } finally {
      setNotifying(null);
    }
  };

  const getEmpName = (id: string) => employees.find(e => e.id === id)?.name || 'Unknown';

  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Header title="Tasks" subtitle="Create and track team tasks" />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h2 className="page-title">Task Room</h2>
            <p className="page-subtitle">{tasks.length} total tasks</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div className="search-bar">
              <input className="input" placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 240, paddingLeft: '2.25rem' }} />
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
            <button className="btn btn-primary" onClick={() => { setForm(f => ({ ...f, assignedTo: employees[0]?.id || '' })); setShowAdd(true); }}>
              <Plus size={16} /> New Task
            </button>
          </div>
        </div>

        {/* Kanban */}
        <div className="kanban">
          {STATUSES.map(status => (
            <div key={status} className="kanban-col">
              <div className="kanban-col-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[status] }} />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{STATUS_LABELS[status]}</span>
                </div>
                <span className="badge badge-gray" style={{ minWidth: 24, justifyContent: 'center' }}>{byStatus(status).length}</span>
              </div>

              {byStatus(status).map(task => {
                const emp = employees.find(e => e.id === task.assignedTo);
                const overdue = task.deadline < today && task.status !== 'completed';
                return (
                  <div key={task.id} className="task-card" onClick={() => setViewTask(task)} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', flex: 1 }}>{task.title}</span>
                      <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                        <button
                          title="Notify Employee via AI Email"
                          className="btn btn-icon btn-secondary btn-sm"
                          onClick={e => handleNotify(e, task)}
                          style={{ padding: '0.2rem', borderColor: 'var(--brand-200)' }}
                          disabled={notifying === task.id}
                        >
                          <Send size={12} color={notifying === task.id ? 'var(--text-muted)' : 'var(--brand-500)'} />
                        </button>
                        <button
                          className="btn btn-icon btn-danger btn-sm"
                          onClick={e => { e.stopPropagation(); setConfirmDelete(task); }}
                          style={{ padding: '0.2rem' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                      {task.description.slice(0, 80)}{task.description.length > 80 ? '…' : ''}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                       <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <PriorityBadge priority={task.priority} />
                        {/* We could add an activity badge here if we had some flag */}
                       </div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                         {emp && <Avatar name={emp.name} size="sm" />}
                         <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{emp?.name.split(' ')[0]}</span>
                       </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.72rem', color: overdue ? 'var(--red)' : 'var(--text-muted)' }}>
                        {overdue ? '⚠ ' : ''}Due {task.deadline}
                      </span>
                      {notifications.some(n => !n.isRead && n.message.includes(task.title)) && (
                        <span className="badge badge-blue animate-pulse" style={{ fontSize: '0.65rem' }}>New Update</span>
                      )}
                    </div>
                    {/* Status changer */}
                    <select
                      className="select"
                      style={{ marginTop: '0.625rem', fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}
                      value={task.status}
                      onChange={e => { e.stopPropagation(); changeStatus(task, e.target.value as TaskStatus); }}
                      onClick={e => e.stopPropagation()}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                  </div>
                );
              })}
              {byStatus(status).length === 0 && (
                <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                  <span style={{ fontSize: '0.8rem' }}>No tasks here</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAdd && (
        <Modal
          title="Create New Task"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddTask} disabled={isAdding}>
                {isAdding ? 'Creating...' : 'Create Task'}
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Task Title</label>
              <input className="input" placeholder="Enter task title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="textarea" rows={3} placeholder="Task description…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select className="select" value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as TaskPriority }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input type="date" className="input" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
            </div>
          </div>
        </Modal>
      )}

      {/* View Task Modal with Activity Hub */}
      {viewTask && (
        <Modal 
          title="Task Room & Activity Hub" 
          onClose={() => setViewTask(null)}
          size="xl"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2rem', maxHeight: '75vh' }} className="animate-fade-in">
            
            {/* Left Column: Activity & Feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'hidden' }}>
              <div className="glass" style={{ padding: '1.5rem', borderRadius: 20 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--brand-400)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Task Details</div>
                <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '1.5rem', color: '#fff' }}>{viewTask.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: 1.6 }}>{viewTask.description}</p>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h5 className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-muted">
                    <History size={14} /> Activity Feed & Conversation
                  </h5>
                  <span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>{updates.length} Updates</span>
                </div>
                
                {/* Compact Scrollable Box for Activity */}
                <div 
                  ref={scrollRef}
                  style={{ 
                    maxHeight: '300px', 
                    overflowY: 'auto', 
                    padding: '1.5rem', 
                    background: 'rgba(0,0,0,0.2)', 
                    borderRadius: 20, 
                    border: '1px solid rgba(255,255,255,0.05)',
                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem'
                  }}
                >
                  {updates.length === 0 ? (
                    <div className="text-center py-12 text-muted text-sm italic">
                      No activity recorded yet for this task.
                    </div>
                  ) : (
                    updates.map((upd, idx) => {
                      const isEmployee = !upd.userId.includes('admin') && !upd.type.includes('reply') && !upd.type.includes('admin');
                      const isNewest = idx === 0;
                      return (
                        <div key={upd.id} className="animate-fade-in" style={{ 
                          display: 'flex', gap: '0.85rem',
                          alignItems: 'flex-start',
                          flexDirection: isEmployee ? 'row' : 'row-reverse',
                          opacity: isNewest ? 1 : 0.6,
                          transform: isNewest ? 'scale(1)' : 'scale(0.98)',
                          transition: 'all 0.3s ease'
                        }}>
                          <div style={{ 
                            width: 32, height: 32, borderRadius: '50%', 
                            background: isEmployee ? 'var(--brand-500)' : 'var(--purple)', 
                            color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: isNewest ? '0 4px 12px rgba(var(--purple-rgb), 0.3)' : 'none'
                          }}>
                            {isEmployee ? <UserIcon size={14} /> : <MessageSquare size={14} />}
                          </div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: isEmployee ? 'flex-start' : 'flex-end' }}>
                            <div className="flex items-baseline gap-2 mb-1.5" style={{ flexDirection: isEmployee ? 'row' : 'row-reverse' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{isEmployee ? upd.userName : (upd.userName || 'Admin (You)')}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(upd.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className={`chat-bubble ${isEmployee ? 'chat-bubble-sent' : 'chat-bubble-admin'}`} style={{ fontSize: '0.85rem', padding: '0.6rem 0.9rem' }}>
                              {upd.note}
                              {upd.type === 'status_change' && (
                                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.7rem', opacity: 0.8 }}>
                                  STATUS: {upd.statusAtUpdate.toUpperCase()}
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
            </div>

            {/* Right Column: Metadata & Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div className="gradient-bg" style={{ borderRadius: 20, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h5 className="font-bold text-xs uppercase tracking-widest text-muted mb-4">Task Management</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    ['Assigned To', <div className="flex items-center gap-2"><Avatar name={getEmpName(viewTask.assignedTo)} size="sm" /> {getEmpName(viewTask.assignedTo)}</div>],
                    ['Deadline', <span style={{ color: viewTask.deadline < today ? 'var(--red)' : 'inherit' }}>{viewTask.deadline}</span>],
                    ['Priority', <PriorityBadge priority={viewTask.priority} />],
                    ['Status', (
                      <select 
                        className="select" 
                        style={{ background: 'rgba(255,255,255,0.05)', height: '32px', padding: '0 0.5rem', borderRadius: '8px', fontSize: '0.8rem', width: 'auto' }}
                        value={viewTask.status}
                        onChange={async (e) => {
                          const newStatus = e.target.value as TaskStatus;
                          const now = new Date().toISOString();
                          
                          // Update Task
                          const updated = { ...viewTask, status: newStatus, updatedAt: now.split('T')[0] };
                          await updateTask(updated);
                          setViewTask(updated); // Local state update
                          
                          // Log status change
                          if (session) {
                            await addTaskUpdate({
                              id: generateId(),
                              taskId: viewTask.id,
                              userId: session.userId,
                              userName: session.name,
                              note: `${session.name} changed status to ${newStatus.toUpperCase()}`,
                              statusAtUpdate: newStatus,
                              createdAt: now,
                              type: 'status_change'
                            });
                          }
                          
                          // Refresh updates
                          const updatedUpdates = await getTaskUpdates(viewTask.id);
                          setUpdates(updatedUpdates);
                          load(); // Refresh main task board
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    )],
                  ].map(([k, v]) => (
                    <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{k}</div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass" style={{ borderRadius: 20, padding: '1.5rem' }}>
                <h5 className="font-bold text-xs uppercase tracking-widest text-muted mb-4">Quick Response</h5>
                <form onSubmit={handleAdminReply} className="flex flex-col gap-4">
                  <textarea 
                    className="textarea" 
                    rows={4} 
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16 }}
                    placeholder="Provide directions or feedback..." 
                    value={adminNote}
                    onChange={e => setAdminNote(e.target.value)}
                    required
                  />
                  <button className="btn btn-primary w-full" style={{ justifyContent: 'center', height: 48, borderRadius: 12 }} disabled={isUpdating || !adminNote.trim()}>
                    {isUpdating ? <div className="spinner"></div> : <><Send size={16} /> Post Admin Reply</>}
                  </button>
                </form>
              </div>

              <div style={{ flex: 1 }}></div>
              <button className="btn btn-secondary w-full" onClick={() => setViewTask(null)} style={{ justifyContent: 'center', borderColor: 'rgba(255,255,255,0.1)' }}>
                 Close Command Center
              </button>
            </div>

          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <Modal
          title="Delete Task"
          onClose={() => setConfirmDelete(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} style={{ background: 'var(--red)', color: '#fff' }}>Delete</button>
            </>
          }
        >
          <p>Are you sure you want to delete <strong>{confirmDelete.title}</strong>? This cannot be undone.</p>
        </Modal>
      )}
    </div>
  );
}
