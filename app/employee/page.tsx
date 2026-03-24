'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckSquare, LogIn, AlertTriangle } from 'lucide-react';
import Header from '@/components/layout/Header';
import { TaskStatusBadge, PriorityBadge } from '@/components/ui/Badges';
import { getSession } from '@/lib/auth';
import { getTasksByUser, getTodayAttendance, saveAttendance, generateId } from '@/lib/store';
import type { Task, AttendanceRecord, AuthSession } from '@/types';
import Link from 'next/link';

export default function EmployeeDashboard() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord | undefined>();
  const [time, setTime] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchEm = async () => {
      const s = getSession();
      if (s) {
        setSession(s);
        setTasks(await getTasksByUser(s.userId));
        setAttendance(await getTodayAttendance(s.userId));
      }
    };
    fetchEm();
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = async () => {
    if (!session || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const nowStr = new Date().toTimeString().slice(0, 5);
      const dateStr = new Date().toISOString().split('T')[0];
      await saveAttendance({
        id: generateId(), date: dateStr, userId: session.userId, status: 'present', checkIn: nowStr
      });
      setAttendance(await getTodayAttendance(session.userId));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    if (!attendance || !session || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const nowStr = new Date().toTimeString().slice(0, 5);
      const inDate = new Date(`1970-01-01T${attendance.checkIn}:00`);
      const outDate = new Date(`1970-01-01T${nowStr}:00`);
      const hrs = Math.round(((outDate.getTime() - inDate.getTime()) / 1000 / 60 / 60) * 10) / 10;
      await saveAttendance({ ...attendance, checkOut: nowStr, workingHours: Math.max(0, hrs) });
      setAttendance(await getTodayAttendance(session.userId));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) return null;

  const pending = tasks.filter(t => t.status === 'pending');
  const inProgress = tasks.filter(t => t.status === 'in-progress');
  const today = new Date().toISOString().split('T')[0];
  const overdue = tasks.filter(t => t.deadline < today && t.status !== 'completed');
  const topTasks = [...pending, ...inProgress].slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Header title="My Dashboard" subtitle={`Welcome back, ${session.name.split(' ')[0]}!`} />
      <div className="page-content">

        {/* Top Row: Attendance + Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Quick Check-in Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: 'linear-gradient(180deg, var(--bg-card), var(--bg-hover))' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 300, fontFamily: 'var(--font-geist-mono), monospace', marginBottom: '0.5rem', color: 'var(--brand-400)' }}>
              {time.toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit', second:'2-digit' })}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              {time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <div style={{ width: '100%', padding: '1.25rem', background: 'var(--bg-base)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Check In</span>
                <span style={{ fontWeight: 600 }}>{attendance?.checkIn || '--:--'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Check Out</span>
                <span style={{ fontWeight: 600 }}>{attendance?.checkOut || '--:--'}</span>
              </div>

              {!attendance?.checkIn ? (
                <button className="btn btn-primary w-full" onClick={handleCheckIn} disabled={isSubmitting} style={{ justifyContent: 'center', opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                  <LogIn size={16} /> {isSubmitting ? 'Saving...' : 'Check In Now'}
                </button>
              ) : !attendance.checkOut ? (
                <button className="btn w-full" onClick={handleCheckOut} disabled={isSubmitting} style={{ justifyContent: 'center', background: 'var(--yellow)', color: '#000', opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                  <Clock size={16} /> {isSubmitting ? 'Saving...' : 'Check Out'}
                </button>
              ) : (
                <div style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--green)', padding: '0.625rem', borderRadius: 8, fontSize: '0.85rem', fontWeight: 500 }}>
                  <CheckSquare size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Shift Completed ({attendance.workingHours}h)
                </div>
              )}
            </div>
          </div>

          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '1rem' }}>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--yellow)' }}><CheckSquare size={20} /></div>
              <div><div className="kpi-value">{pending.length}</div><div className="kpi-label">Pending Tasks</div></div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--brand-400)' }}><CheckSquare size={20} /></div>
              <div><div className="kpi-value">{inProgress.length}</div><div className="kpi-label">Tasks In Progress</div></div>
            </div>
            <div className="kpi-card" style={{ gridColumn: '1 / span 2', display: 'flex', alignItems: 'center' }}>
              <div className="kpi-icon" style={{ background: overdue.length ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: overdue.length ? 'var(--red)' : 'var(--green)' }}>
                {overdue.length ? <AlertTriangle size={20} /> : <CheckSquare size={20} />}
              </div>
              <div style={{ flex: 1 }}>
                <div className="kpi-value">{overdue.length}</div>
                <div className="kpi-label">Overdue Tasks</div>
              </div>
              {overdue.length > 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--red)', background: 'rgba(239,68,68,0.1)', padding: '0.5rem 0.75rem', borderRadius: 8 }}>
                  Requires immediate attention
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Tasks Widget */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontWeight: 600 }}>Active Tasks</h3>
            <Link href="/employee/tasks" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          {topTasks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>You have no active tasks currently.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Priority</th>
                    <th>Deadline</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topTasks.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 500 }}>{t.title}</td>
                      <td><PriorityBadge priority={t.priority} /></td>
                      <td style={{ color: t.deadline < today ? 'var(--red)' : 'inherit' }}>{t.deadline}</td>
                      <td><TaskStatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
