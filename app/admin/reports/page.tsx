'use client';

import { useState, useEffect } from 'react';
import { Download, BarChart2, CheckCircle, Clock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import Header from '@/components/layout/Header';
import Avatar from '@/components/layout/Avatar';
import Modal from '@/components/ui/Modal';
import { getUsers, getTasks, getAttendance } from '@/lib/store';
import { downloadCSV } from '@/utils/csvExport';
import { supabase } from '@/utils/supabase/client';
import type { User, Task, AttendanceRecord } from '@/types';

export default function ReportsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  
  // AI Export State
  const [aiQuery, setAiQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportConfig, setExportConfig] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);

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

  const handleAiQuery = async () => {
    if (!aiQuery.trim()) return;
    setIsQuerying(true);
    try {
      const res = await fetch('/api/reports/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiQuery })
      });
      const data = await res.json();
      setExportConfig(data);
      
      // Fetch Preview Data immediately
      const { type, startDate, endDate, employeeId } = data;
      let preview: any[] = [];
      const endDateTime = `${endDate}T23:59:59`;

      if (type === 'attendance') {
        let q = supabase.from('attendance_records').select('*, users(name, email)').gte('date', startDate).lte('date', endDate);
        if (employeeId) q = q.eq('user_id', employeeId);
        const { data: att } = await q.limit(5);
        if (att) preview = att.map(r => ({ col1: r.date, col2: r.users?.name, col3: r.status }));
      } else if (type === 'tasks') {
        let q = supabase.from('tasks').select('*, users(name)').gte('created_at', startDate).lte('created_at', endDateTime);
        if (employeeId) q = q.eq('assigned_to', employeeId);
        const { data: tks } = await q.limit(5);
        if (tks) preview = tks.map(r => ({ col1: r.title, col2: r.users?.name, col3: r.status }));
      } else if (type === 'employees') {
        let q = supabase.from('users').select('*').eq('role', 'employee');
        if (employeeId) q = q.eq('id', employeeId);
        const { data: emps } = await q.limit(5);
        if (emps) preview = emps.map((r: any) => ({ col1: r.name, col2: r.department, col3: r.position }));
      } else if (type === 'all') {
        const [a, t] = await Promise.all([
          supabase.from('attendance_records').select('*, users(name)').gte('date', startDate).lte('date', endDate).limit(2),
          supabase.from('tasks').select('*, users(name)').gte('created_at', startDate).lte('created_at', endDateTime).limit(3)
        ]);
        preview = [
          ...(a.data || []).map((r: any) => ({ col1: r.date, col2: r.users?.name, col3: 'Attendance' })),
          ...(t.data || []).map((r: any) => ({ col1: r.title, col2: r.users?.name, col3: 'Task' }))
        ];
      }
      
      setPreviewData(preview);
      setShowExportModal(true);
    } catch (error) {
      console.error('AI Query failed:', error);
      alert('Failed to parse your query. Please try again.');
    } finally {
      setIsQuerying(false);
    }
  };

  const executeExport = async () => {
    setIsExporting(true);
    try {
      const { type, startDate, endDate, employeeId } = exportConfig;
      let dataToExport: any[] = [];
      let fileName = `report_${type}_${startDate}_to_${endDate}`;
      const endDateTime = `${endDate}T23:59:59`;
      if (type === 'attendance') {
        let query = supabase.from('attendance_records').select('*, users(name, email)').gte('date', startDate).lte('date', endDate);
        if (employeeId) query = query.eq('user_id', employeeId);
        const { data } = await query;
        if (data) {
          dataToExport = data.map((r: any) => ({
            Date: r.date,
            Employee: r.users?.name,
            Email: r.users?.email,
            Status: r.status,
            CheckIn: r.check_in,
            CheckOut: r.check_out,
            WorkHours: r.working_hours
          }));
        }
      } else if (type === 'tasks') {
        let query = supabase.from('tasks').select('*, users(name)').gte('created_at', startDate).lte('created_at', endDateTime);
        if (employeeId) query = query.eq('assigned_to', employeeId);
        const { data } = await query;
        if (data) {
          dataToExport = data.map((r: any) => ({
            Created: r.created_at,
            Title: r.title,
            Description: r.description,
            AssignedTo: r.users?.name,
            Status: r.status,
            Priority: r.priority,
            Deadline: r.deadline
          }));
        }
      } else if (type === 'employees') {
        let query = supabase.from('users').select('*').eq('role', 'employee');
        if (employeeId) query = query.eq('id', employeeId);
        const { data: emps } = await query;
        if (emps) {
          dataToExport = emps.map((r: any) => ({
            ID: r.id,
            Name: r.name,
            Email: r.email,
            Department: r.department,
            Position: r.position,
            Phone: r.phone,
            JoinDate: r.joinDate
          }));
        }
      } else if (type === 'all') {
        // Unified Master Report
        const [attRes, taskRes, leaveRes] = await Promise.all([
          supabase.from('attendance_records').select('*, users(name, email)').gte('date', startDate).lte('date', endDate).order('date'),
          supabase.from('tasks').select('*, users(name)').gte('created_at', startDate).lte('created_at', endDateTime).order('created_at'),
          supabase.from('leave_requests').select('*, users(name)').gte('from_date', startDate).lte('from_date', endDate).order('from_date')
        ]);

        const combined = [
          ...(attRes.data || []).map((r: any) => ({
            Type: 'Attendance',
            Date: r.date,
            Employee: r.users?.name,
            Status: r.status,
            Details: `Check ${r.check_in || 'N/A'} - ${r.check_out || 'N/A'}`
          })),
          ...(taskRes.data || []).map((r: any) => ({
            Type: 'Task',
            Date: r.created_at.split('T')[0],
            Employee: r.users?.name,
            Status: r.status,
            Details: `${r.title} [${r.priority}]`
          })),
          ...(leaveRes.data || []).map((r: any) => ({
            Type: 'Leave',
            Date: r.from_date,
            Employee: r.users?.name,
            Status: r.status,
            Details: `${r.type} leave: ${r.reason}`
          }))
        ];
        dataToExport = combined.sort((a, b) => a.Date.localeCompare(b.Date));
      }

      if (dataToExport.length > 0) {
        downloadCSV(dataToExport, fileName);
        setShowExportModal(false);
        setAiQuery('');
      } else {
        alert('No data found for the selected filters.');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to generate report.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Header title="Reports & Analytics" subtitle="Overall company performance metrics" />
      <div className="page-content">
        <div className="page-header" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h2 className="page-title">Performance Overview</h2>
            <p className="page-subtitle">Metrics for all time</p>
          </div>
          
          <div className="card" style={{ padding: '0.75rem', display: 'flex', gap: '0.75rem', width: '100%', maxWidth: 500, background: 'var(--bg-app)', border: '1px solid var(--border)' }}>
            <input 
              className="input" 
              placeholder="Ask AI: 'Export attendance for John in March'..." 
              style={{ border: 'none', background: 'transparent' }}
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAiQuery()}
            />
            <button className="btn btn-primary" onClick={handleAiQuery} disabled={isQuerying || !aiQuery.trim()}>
              {isQuerying ? 'Analyzing...' : 'Generate Report'}
            </button>
          </div>
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

      {showExportModal && exportConfig && (
        <Modal
          title="Confirm AI Report Export"
          onClose={() => setShowExportModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowExportModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={executeExport} disabled={isExporting}>
                {isExporting ? 'Generating CSV...' : 'Confirm & Download'}
              </button>
            </>
          }
        >
          <div style={{ padding: '0.5rem' }}>
            <div className="card" style={{ background: 'rgba(59,130,246,0.05)', border: '1px dashed var(--brand-500)', marginBottom: '1.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, color: 'var(--brand-600)' }}>
                ✨ {exportConfig.explanation}
              </p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Report Type</label>
                <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{exportConfig.type}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Time Period</label>
                <div style={{ fontWeight: 600 }}>{exportConfig.startDate} to {exportConfig.endDate}</div>
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Target Employee</label>
              <div style={{ fontWeight: 600, marginBottom: '1.5rem' }}>
                {exportConfig.employeeId ? (users.find(u => u.id === exportConfig.employeeId)?.name || 'Matching Employee') : 'All Employees'}
              </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-app)', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>DATA PREVIEW (LATEST 5 RECORDS)</span>
                <span>{previewData.length > 0 ? '✓ Match Found' : '⚠️ No Records Found'}</span>
              </div>
              <div className="table-wrap" style={{ maxHeight: 200 }}>
                <table className="table" style={{ fontSize: '0.8rem' }}>
                  <tbody>
                    {previewData.length > 0 ? (
                      previewData.map((row, i) => (
                        <tr key={i}>
                          <td style={{ padding: '0.5rem 1rem' }}>{row.col1}</td>
                          <td style={{ padding: '0.5rem 1rem' }}>{row.col2}</td>
                          <td style={{ padding: '0.5rem 1rem' }}>{row.col3}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No data found for this range/employee. <br/>
                          Try adjusting your request dates.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
