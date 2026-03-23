'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Send } from 'lucide-react';
import Header from '@/components/layout/Header';
import Avatar from '@/components/layout/Avatar';
import Modal from '@/components/ui/Modal';
import { TaskStatusBadge, PriorityBadge } from '@/components/ui/Badges';
import { getTasks, getUsers, addTask, updateTask, deleteTask, generateId } from '@/lib/store';
import { getSession } from '@/lib/auth';
import type { Task, TaskStatus, TaskPriority, User } from '@/types';

const STATUSES: TaskStatus[] = ['pending', 'in-progress', 'completed'];
const STATUS_LABELS: Record<TaskStatus, string> = { pending: 'Pending', 'in-progress': 'In Progress', completed: 'Completed' };
const STATUS_COLORS: Record<TaskStatus, string> = { pending: 'var(--yellow)', 'in-progress': 'var(--brand-400)', completed: 'var(--green)' };

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [viewTask, setViewTask] = useState<Task | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);
  const [notifying, setNotifying] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', priority: 'medium' as TaskPriority, deadline: '' });

  const load = async () => { setTasks(await getTasks()); };
  useEffect(() => {
    load();
    const fetchUsers = async () => {
      const u = await getUsers();
      setEmployees(u.filter(user => user.role === 'employee'));
    };
    fetchUsers();
  }, []);

  const session = getSession();
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
            <h2 className="page-title">Task Board</h2>
            <p className="page-subtitle">{tasks.length} total tasks</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div className="search-bar">
              <Search size={15} />
              <input className="input" placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 240 }} />
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
                  <div key={task.id} className="task-card" onClick={() => setViewTask(task)}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <PriorityBadge priority={task.priority} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {emp && <Avatar name={emp.name} size="sm" />}
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{emp?.name.split(' ')[0]}</span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: overdue ? 'var(--red)' : 'var(--text-muted)' }}>
                        {overdue ? '⚠ ' : ''}Due {task.deadline}
                      </span>
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

      {/* View Task Modal */}
      {viewTask && (
        <Modal title="Task Details" onClose={() => setViewTask(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{viewTask.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{viewTask.description}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <TaskStatusBadge status={viewTask.status} />
              <PriorityBadge priority={viewTask.priority} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
              {[
                ['Assigned To', getEmpName(viewTask.assignedTo)],
                ['Deadline', viewTask.deadline],
                ['Created', viewTask.createdAt],
                ['Updated', viewTask.updatedAt],
              ].map(([k, v]) => (
                <div key={k} style={{ background: 'var(--bg-input)', padding: '0.625rem', borderRadius: 8 }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem', fontSize: '0.75rem' }}>{k}</div>
                  <div style={{ fontWeight: 500 }}>{v}</div>
                </div>
              ))}
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
