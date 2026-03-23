'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import { LeaveStatusBadge } from '@/components/ui/Badges';
import { getLeavesByUser, addLeave, generateId, getUsers } from '@/lib/store';
import { getSession } from '@/lib/auth';
import type { LeaveRequest, LeaveType, User } from '@/types';

export default function EmployeeLeavesPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: 'sick' as LeaveType, fromDate: '', toDate: '', reason: '' });

  const [adminUsers, setAdminUsers] = useState<User[]>([]);

  const load = async () => {
    const session = getSession();
    if (session) {
      const data = await getLeavesByUser(session.userId);
      setLeaves(data.sort((a,b) => b.appliedAt.localeCompare(a.appliedAt)));
    }
  };
  useEffect(() => { 
    load(); 
    getUsers().then(u => setAdminUsers(u));
  }, []);

  const handleApply = async () => {
    const session = getSession();
    if (!session || !form.fromDate || !form.toDate || !form.reason) return;
    await addLeave({
      id: generateId(),
      userId: session.userId,
      status: 'pending',
      appliedAt: new Date().toISOString().split('T')[0],
      ...form,
    });
    setShowAdd(false);
    setForm({ type: 'sick', fromDate: '', toDate: '', reason: '' });
    load();
  };

  const getUserName = (id?: string) => {
    if (!id) return '';
    return adminUsers.find(u => u.id === id)?.name || 'Admin';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Header title="My Leave Requests" subtitle="Apply and track your time off" />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h2 className="page-title">Leave History</h2>
            <p className="page-subtitle">{leaves.length} total requests</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Apply Leave
          </button>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Dates</th>
                  <th>Type</th>
                  <th>Reason</th>
                  <th>Applied On</th>
                  <th>Status</th>
                  <th>Admin Note</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map(leave => (
                  <tr key={leave.id}>
                    <td style={{ fontWeight: 500 }}>
                      {leave.fromDate} <span style={{ color: 'var(--text-muted)' }}>→</span> {leave.toDate}
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{leave.type}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{leave.reason}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{leave.appliedAt}</td>
                    <td><LeaveStatusBadge status={leave.status} /></td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {leave.status !== 'pending' && leave.reviewedAt ? (
                        <span>Reviewed by {getUserName(leave.reviewedBy)} on {leave.reviewedAt}</span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
                {leaves.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No leave history found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAdd && (
        <Modal
          title="Apply for Leave"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleApply}>Submit Request</button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Leave Type</label>
              <select className="select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as LeaveType }))}>
                <option value="sick">Sick Leave</option>
                <option value="casual">Casual Leave</option>
                <option value="earned">Earned Leave</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">From Date</label>
                <input type="date" className="input" min={new Date().toISOString().split('T')[0]} value={form.fromDate} onChange={e => setForm(f => ({ ...f, fromDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">To Date</label>
                <input type="date" className="input" min={form.fromDate || new Date().toISOString().split('T')[0]} value={form.toDate} onChange={e => setForm(f => ({ ...f, toDate: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Reason</label>
              <textarea className="textarea" rows={3} placeholder="Briefly explain your reason…" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
