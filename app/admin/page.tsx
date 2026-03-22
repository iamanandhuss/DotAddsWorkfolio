'use client';

import { useEffect, useState } from 'react';
import { Users, CheckSquare, Clock, CalendarDays, TrendingUp, AlertCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell
} from 'recharts';
import Header from '@/components/layout/Header';
import Avatar from '@/components/layout/Avatar';
import { TaskStatusBadge } from '@/components/ui/Badges';
import { getUsers, getTasks, getAttendance, getLeaves } from '@/lib/store';
import type { User, Task, AttendanceRecord, LeaveRequest } from '@/types';

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    setUsers(getUsers().filter(u => u.role === 'employee'));
    setTasks(getTasks());
    setAttendance(getAttendance());
    setLeaves(getLeaves());
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(a => a.date === today && a.status === 'present');
  const pendingLeaves = leaves.filter(l => l.status === 'pending');

  // Chart: Task completion per employee
  const taskChartData = users.map(u => {
    const myTasks = tasks.filter(t => t.assignedTo === u.id);
    return {
      name: u.name.split(' ')[0],
      completed: myTasks.filter(t => t.status === 'completed').length,
      pending: myTasks.filter(t => t.status === 'pending').length,
      inProgress: myTasks.filter(t => t.status === 'in-progress').length,
    };
  });

  // Chart: Weekly attendance trend (last 7 days)
  const attendanceChartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en', { weekday: 'short' });
    const count = attendance.filter(a => a.date === dateStr && a.status === 'present').length;
    return { day: dayName, present: count, total: users.length };
  });

  // Pie chart: Task status breakdown
  const taskStatusData = [
    { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length, color: '#10b981' },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length, color: '#3b82f6' },
    { name: 'Pending', value: tasks.filter(t => t.status === 'pending').length, color: '#f59e0b' },
  ];

  const recentTasks = [...tasks].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);

  const kpis = [
    { label: 'Total Employees', value: users.length, icon: <Users size={20} />, color: '#2563eb', bg: 'rgba(37,99,235,0.15)' },
    { label: 'Active Tasks', value: tasks.filter(t => t.status !== 'completed').length, icon: <CheckSquare size={20} />, color: '#7c3aed', bg: 'rgba(124,58,237,0.15)' },
    { label: 'Present Today', value: todayAttendance.length, icon: <Clock size={20} />, color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    { label: 'Pending Leaves', value: pendingLeaves.length, icon: <CalendarDays size={20} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  ];

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Header title="Dashboard" subtitle={`Welcome back! ${new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}`} />
      <div className="page-content">

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
          {kpis.map(k => (
            <div key={k.label} className="kpi-card">
              <div className="kpi-icon" style={{ background: k.bg }}>
                <span style={{ color: k.color }}>{k.icon}</span>
              </div>
              <div>
                <div className="kpi-value">{k.value}</div>
                <div className="kpi-label">{k.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.75rem' }}>
          {/* Bar Chart */}
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={16} style={{ color: 'var(--brand-400)' }} /> Task Completion per Employee
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={taskChartData} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }} />
                <Bar dataKey="completed"  fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="inProgress" fill="#3b82f6" radius={[4,4,0,0]} />
                <Bar dataKey="pending"    fill="#f59e0b" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Line Chart */}
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} style={{ color: 'var(--green)' }} /> Weekly Attendance Trend
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={attendanceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }} />
                <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem' }}>
          {/* Recent Tasks */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>Recent Task Activity</div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Assigned To</th>
                    <th>Status</th>
                    <th>Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTasks.map(task => (
                    <tr key={task.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{task.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.priority} priority</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Avatar name={getUserName(task.assignedTo)} size="sm" />
                          {getUserName(task.assignedTo)}
                        </div>
                      </td>
                      <td><TaskStatusBadge status={task.status} /></td>
                      <td style={{ fontSize: '0.8rem', color: task.deadline < today ? 'var(--red)' : 'var(--text-secondary)' }}>
                        {task.deadline}
                        {task.deadline < today && task.status !== 'completed' && (
                          <AlertCircle size={12} style={{ display: 'inline', marginLeft: 4 }} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Task Status Pie + Pending Leaves */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: '1rem' }}>Task Status Overview</div>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={taskStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" paddingAngle={3}>
                    {taskStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                {taskStatusData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{d.name}</span>
                    <span style={{ fontWeight: 600 }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                Pending Leaves
                <span className="badge badge-yellow">{pendingLeaves.length}</span>
              </div>
              {pendingLeaves.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No pending requests</p>
              ) : pendingLeaves.slice(0, 3).map(l => {
                const emp = users.find(u => u.id === l.userId);
                return (
                  <div key={l.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                    <Avatar name={emp?.name || '?'} size="sm" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.825rem', fontWeight: 500 }}>{emp?.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{l.fromDate} → {l.toDate}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
