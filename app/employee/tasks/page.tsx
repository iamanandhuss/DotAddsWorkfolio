'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { TaskStatusBadge, PriorityBadge } from '@/components/ui/Badges';
import { getTasksByUser, updateTask } from '@/lib/store';
import { getSession } from '@/lib/auth';
import type { Task, TaskStatus } from '@/types';

export default function EmployeeTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const load = async () => {
    const session = getSession();
    if (session) {
      const data = await getTasksByUser(session.userId);
      setTasks(data.sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)));
    }
  };
  useEffect(() => { load(); }, []);

  const changeStatus = async (task: Task, status: TaskStatus) => {
    await updateTask({ ...task, status, updatedAt: new Date().toISOString().split('T')[0] });
    
    // Notify Admin via AI
    const session = getSession();
    if (session) {
      fetch('/api/notify/general', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'status_change',
          userId: session.userId,
          data: { taskTitle: task.title, newStatus: status }
        })
      }).catch(err => console.error('Failed to notify admin:', err));
    }
    
    load();
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Header title="My Tasks" subtitle="Update task statuses and manage your workflow" />
      <div className="page-content">
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Task Title & Description</th>
                  <th>Priority</th>
                  <th>Deadline</th>
                  <th>Current Status</th>
                  <th>Update Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => {
                  const overdue = task.deadline < today && task.status !== 'completed';
                  return (
                    <tr key={task.id}>
                      <td style={{ maxWidth: 300 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>{task.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, whiteSpace: 'normal' }}>
                          {task.description}
                        </div>
                      </td>
                      <td><PriorityBadge priority={task.priority} /></td>
                      <td style={{ color: overdue ? 'var(--red)' : 'var(--text-secondary)' }}>
                        {task.deadline}
                        {overdue && <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>OVERDUE</div>}
                      </td>
                      <td><TaskStatusBadge status={task.status} /></td>
                      <td>
                        <select
                          className="select"
                          style={{ width: 140 }}
                          value={task.status}
                          onChange={e => changeStatus(task, e.target.value as TaskStatus)}
                          disabled={task.status === 'completed'}
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
                {tasks.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No tasks assigned.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
