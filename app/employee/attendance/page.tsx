'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { AttendanceBadge } from '@/components/ui/Badges';
import { getAttendanceByUser } from '@/lib/store';
import { getSession } from '@/lib/auth';
import type { AttendanceRecord } from '@/types';

export default function EmployeeAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const session = getSession();
    if (session) {
      setRecords(getAttendanceByUser(session.userId).sort((a,b) => b.date.localeCompare(a.date)));
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Header title="My Attendance" subtitle="Your daily check-in history" />
      <div className="page-content">
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours Worked</th>
                </tr>
              </thead>
              <tbody>
                {records.map(record => (
                  <tr key={record.id}>
                    <td style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
                      {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td><AttendanceBadge status={record.status} /></td>
                    <td style={{ fontFamily: 'var(--font-geist-mono)' }}>{record.checkIn || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-geist-mono)' }}>{record.checkOut || '—'}</td>
                    <td>
                      {record.workingHours ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="progress" style={{ width: 80 }}><div className="progress-bar" style={{ width: `${Math.min((record.workingHours / 8) * 100, 100)}%`, background: record.workingHours >= 8 ? 'var(--green)' : 'var(--blue)' }} /></div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{record.workingHours}h</span>
                        </div>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No attendance records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
