'use client';

import { useState, useEffect } from 'react';
import { Search, Calendar as CalendarIcon, Edit2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Avatar from '@/components/layout/Avatar';
import Modal from '@/components/ui/Modal';
import { AttendanceBadge } from '@/components/ui/Badges';
import { getAttendance, getUsers, saveAttendance } from '@/lib/store';
import type { AttendanceRecord, AttendanceStatus, User } from '@/types';

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);

  const load = async () => { setRecords(await getAttendance()); };
  useEffect(() => { 
    load(); 
    getUsers().then(u => setEmployees(u.filter(x => x.role === 'employee'))); 
  }, []);

  const dailyRecords = employees.map(emp => {
    const existing = records.find(r => r.userId === emp.id && r.date === date);
    if (existing) return existing;
    return {
      id: `new-${emp.id}-${date}`,
      userId: emp.id,
      date,
      status: 'absent' as AttendanceStatus,
    };
  });

  const filtered = dailyRecords.filter(r => {
    const emp = employees.find(e => e.id === r.userId);
    if (search && !emp?.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleSave = async () => {
    if (editRecord) { await saveAttendance(editRecord); setEditRecord(null); load(); }
  };

  const getEmpName = (id: string) => employees.find(e => e.id === id)?.name || 'Unknown';

  const presentCount = dailyRecords.filter(r => r.status === 'present').length;
  const leaveCount = dailyRecords.filter(r => r.status === 'leave').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Header title="Daily Attendance" subtitle={`Attendance records for ${date}`} />
      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="kpi-card" style={{ padding: '1rem', alignItems: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, minWidth: 40 }}>{employees.length}</div>
            <div style={{ color: 'var(--text-muted)' }}>Total<br/>Staff</div>
          </div>
          <div className="kpi-card" style={{ padding: '1rem', alignItems: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, minWidth: 40, color: 'var(--green)' }}>{presentCount}</div>
            <div style={{ color: 'var(--text-muted)' }}>Present<br/>Today</div>
          </div>
          <div className="kpi-card" style={{ padding: '1rem', alignItems: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, minWidth: 40, color: 'var(--blue)' }}>{leaveCount}</div>
            <div style={{ color: 'var(--text-muted)' }}>On<br/>Leave</div>
          </div>
        </div>

        <div className="page-header" style={{ marginBottom: '1rem' }}>
          <div className="search-bar" style={{ flex: 1, maxWidth: 320 }}>
            <Search size={15} />
            <input className="input" placeholder="Search employee…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="search-bar">
            <CalendarIcon size={15} style={{ left: '0.75rem' }} />
            <input type="date" className="input" style={{ paddingLeft: '2.5rem' }} value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Status</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Work Hours</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(record => {
                  const emp = employees.find(e => e.id === record.userId);
                  return (
                    <tr key={record.userId}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <Avatar name={emp?.name || '?'} size="sm" />
                          <div style={{ fontWeight: 500 }}>{emp?.name}</div>
                        </div>
                      </td>
                      <td><AttendanceBadge status={record.status} /></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{record.checkIn || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{record.checkOut || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {record.workingHours ? `${record.workingHours}h` : '—'}
                      </td>
                      <td>
                        <button className="btn btn-icon btn-secondary" onClick={() => setEditRecord({ ...record, id: record.id.startsWith('new-') ? Date.now().toString() : record.id })} data-tooltip="Edit Record">
                          <Edit2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No employees found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editRecord && (
        <Modal
          title={`Edit Attendance - ${getEmpName(editRecord.userId)}`}
          onClose={() => setEditRecord(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setEditRecord(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save Record</button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="select" value={editRecord.status} onChange={e => setEditRecord(r => ({ ...r!, status: e.target.value as AttendanceStatus }))}>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="half-day">Half Day</option>
                <option value="leave">On Leave</option>
              </select>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Check In Time</label>
                <input type="time" className="input" value={editRecord.checkIn || ''} onChange={e => setEditRecord(r => ({ ...r!, checkIn: e.target.value }))} disabled={editRecord.status === 'absent' || editRecord.status === 'leave'} />
              </div>
              <div className="form-group">
                <label className="form-label">Check Out Time</label>
                <input type="time" className="input" value={editRecord.checkOut || ''} onChange={e => setEditRecord(r => ({ ...r!, checkOut: e.target.value }))} disabled={editRecord.status === 'absent' || editRecord.status === 'leave'} />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
