'use client';

import { useState, useEffect } from 'react';
import { Download, BarChart2, CheckCircle, Clock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import Header from '@/components/layout/Header';
import Avatar from '@/components/layout/Avatar';
import { getUsers, getTasks, getAttendance } from '@/lib/store';
import type { User, Task, AttendanceRecord } from '@/types';

export default function ReportsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const u = await getUsers();
      setUsers(u.filter(user => user.role === 'employee'));
      setTasks(await getTasks());
      setAttendance(await getAttendance());
    };
    fetchData();
  }, []);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalDays = [...new Set(attendance.map(a => a.date))].length;
  const totalPresent = attendance.filter(a => a.status === 'present').length;
  const avgAttendance = totalDays && users.length ? Math.round((totalPresent / (users.length * totalDays)) * 100) : 0;

  const empStats = users.map(u => {
    const myTasks = tasks.filter(t => t.assignedTo === u.id);
    const myCompleted = myTasks.filter(t => t.status === 'completed').length;
    const myPresent = attendance.filter(a => a.userId === u.id && a.status === 'present').length;
    return {
      ...u,
      taskTotal: myTasks.length,
      taskDone: myCompleted,
      taskRate: myTasks.length ? Math.round((myCompleted / myTasks.length) * 100) : 0,
      daysPresent: myPresent,
      attRate: totalDays ? Math.round((myPresent / totalDays) * 100) : 0,
    };
  }).sort((a, b) => b.taskRate - a.taskRate);

  const deptData = users.reduce((acc, u) => {
    acc[u.department] = (acc[u.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const deptChart = Object.entries(deptData).map(([name, value]) => ({ name, value }));
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Header title="Reports & Analytics" subtitle="Overall company performance metrics" />
      <div className="page-content">
        <div className="page-header" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h2 className="page-title">Performance Overview</h2>
            <p className="page-subtitle">Metrics for all time</p>
          </div>
          <button className="btn btn-secondary">
            <Download size={16} /> Export CSV
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(37,99,235,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart2 size={24} style={{ color: 'var(--brand-500)' }} />
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 4 }}>Overall Task Completion</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{completionRate}%</div>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={24} style={{ color: 'var(--green)' }} />
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 4 }}>Tasks Completed</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{completedTasks} / {totalTasks}</div>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={24} style={{ color: 'var(--yellow)' }} />
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 4 }}>Avg Attendance Rate</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{avgAttendance}%</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: '1.5rem' }}>Employee Performance Ranking</h3>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Tasks Done</th>
                    <th>Task Score</th>
                    <th>Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {empStats.map(emp => (
                    <tr key={emp.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <Avatar name={emp.name} size="sm" />
                          <div style={{ fontWeight: 500 }}>{emp.name}</div>
                        </div>
                      </td>
                      <td>{emp.taskDone} / {emp.taskTotal}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="progress" style={{ width: 100 }}><div className="progress-bar" style={{ width: `${emp.taskRate}%`, background: emp.taskRate >= 70 ? 'var(--green)' : emp.taskRate >= 40 ? 'var(--yellow)' : 'var(--red)' }} /></div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{emp.taskRate}%</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', color: emp.attRate >= 80 ? 'var(--green)' : 'var(--red)' }}>
                          {emp.attRate}% ({emp.daysPresent} days)
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: '1.5rem' }}>Department Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={deptChart} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                  {deptChart.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
