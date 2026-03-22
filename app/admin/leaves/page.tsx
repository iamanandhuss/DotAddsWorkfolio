'use client';

import { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Avatar from '@/components/layout/Avatar';
import { LeaveStatusBadge } from '@/components/ui/Badges';
import { getLeaves, getUsers, updateLeave } from '@/lib/store';
import { getSession } from '@/lib/auth';
import type { LeaveRequest, LeaveStatus, User } from '@/types';

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | 'all'>('all');

  const load = () => { setLeaves(getLeaves().sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))); };
  useEffect(() => { load(); setEmployees(getUsers().filter(u => u.role === 'employee')); }, []);

  const session = getSession();

  const filtered = leaves.filter(l => {
    const emp = employees.find(e => e.id === l.userId);
    if (search && !emp?.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    return true;
  });

  const handleAction = (leave: LeaveRequest, status: LeaveStatus) => {
    if (!session) return;
    updateLeave({
      ...leave,
      status,
      reviewedBy: session.userId,
      reviewedAt: new Date().toISOString().split('T')[0],
    });
    load();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Header title="Leave Requests" subtitle="Review and approve employee time off" />
      <div className="page-content">
        <div className="page-header" style={{ marginBottom: '1.25rem' }}>
          <div className="search-bar" style={{ flex: 1, maxWidth: 320 }}>
            <Search size={15} />
            <input className="input" placeholder="Search employee…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} style={{ width: 140 }}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Dates</th>
                  <th>Type & Reason</th>
                  <th>Applied On</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(leave => {
                  const emp = employees.find(e => e.id === leave.userId);
                  return (
                    <tr key={leave.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <Avatar name={emp?.name || '?'} size="sm" />
                          <div style={{ fontWeight: 500 }}>{emp?.name}</div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {leave.fromDate} <br/> to {leave.toDate}
                      </td>
                      <td>
                        <div style={{ textTransform: 'capitalize', fontWeight: 500 }}>{leave.type} Leave</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{leave.reason}</div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{leave.appliedAt}</td>
                      <td><LeaveStatusBadge status={leave.status} /></td>
                      <td>
                        {leave.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-success btn-sm" onClick={() => handleAction(leave, 'approved')}>
                              <CheckCircle size={14} /> Approve
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleAction(leave, 'rejected')}>
                              <XCircle size={14} /> Deny
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Reviewed on {leave.reviewedAt}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No leave requests found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
