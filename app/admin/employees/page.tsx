'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import Header from '@/components/layout/Header';
import Avatar from '@/components/layout/Avatar';
import Modal from '@/components/ui/Modal';
import CreatableSelect from '@/components/ui/CreatableSelect';
import {
  getUsers, addUser, updateUser, deleteUser, generateId,
  getDepartments, getPositions, addDepartment, addPosition,
} from '@/lib/store';
import type { User } from '@/types';

const emptyForm = (depts: string[], positions: string[]): Omit<User, 'id' | 'role'> => ({
  name: '', email: '', password: '',
  department: depts[0] ?? '',
  position: positions[0] ?? '',
  phone: '', joinDate: new Date().toISOString().split('T')[0],
});

export default function EmployeesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [form, setForm] = useState<Omit<User, 'id' | 'role'>>(emptyForm([], []));
  const [showPassword, setShowPassword] = useState(false);

  const loadOptions = async () => {
    const [depts, pos] = await Promise.all([getDepartments(), getPositions()]);
    setDepartments(depts);
    setPositions(pos);
    return { depts, pos };
  };

  const load = async () => {
    const u = await getUsers();
    setUsers(u.filter(x => x.role === 'employee'));
  };

  useEffect(() => {
    loadOptions();
    load();
  }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.department.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = async () => {
    const { depts, pos } = await loadOptions();
    setForm(emptyForm(depts, pos));
    setShowAdd(true);
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: u.password, department: u.department, position: u.position, phone: u.phone, joinDate: u.joinDate });
  };

  const handleSave = async () => {
    if (editUser) {
      await updateUser({ ...editUser, ...form });
      setEditUser(null);
    } else {
      await addUser({ id: generateId(), role: 'employee', ...form });
      setShowAdd(false);
    }
    load();
  };

  const handleDelete = async () => {
    if (confirmDelete) { await deleteUser(confirmDelete.id); setConfirmDelete(null); load(); }
  };

  const handleAddDept = async (name: string) => {
    const updated = await addDepartment(name);
    setDepartments(updated);
  };

  const handleAddPos = async (name: string) => {
    const updated = await addPosition(name);
    setPositions(updated);
  };

  /* ─── text / date / password field helper ─── */
  const field = (key: keyof typeof form, label: string, type = 'text') => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {key === 'password' ? (
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            className="input"
            style={{ paddingRight: '2.5rem' }}
            value={form[key]}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute', right: '0.75rem', top: '50%',
              transform: 'translateY(-50%)', background: 'none',
              border: 'none', padding: 0, cursor: 'pointer',
              color: 'var(--text-muted)', display: 'flex',
            }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      ) : (
        <input type={type} className="input" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} required />
      )}
    </div>
  );

  const modalFooter = (
    <>
      <button className="btn btn-secondary" onClick={() => { setShowAdd(false); setEditUser(null); }}>Cancel</button>
      <button className="btn btn-primary" onClick={handleSave}>
        {editUser ? 'Save Changes' : 'Add Employee'}
      </button>
    </>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Header title="Employees" subtitle="Manage your team members" />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h2 className="page-title">Team Members</h2>
            <p className="page-subtitle">{users.length} employees total</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Add Employee
          </button>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '1rem' }}>
          <div className="search-bar" style={{ maxWidth: 360 }}>
            <Search size={15} />
            <input className="input" placeholder="Search by name, email, department…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Phone</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>No employees found</td></tr>
                )}
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Avatar name={u.name} />
                        <div>
                          <div style={{ fontWeight: 500 }}>{u.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{u.department}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.position}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{u.phone}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{u.joinDate}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button className="btn btn-icon btn-secondary" onClick={() => openEdit(u)} data-tooltip="Edit"><Pencil size={14} /></button>
                        <button className="btn btn-icon btn-danger" onClick={() => setConfirmDelete(u)} data-tooltip="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(showAdd || editUser) && (
        <Modal title={editUser ? 'Edit Employee' : 'Add New Employee'} onClose={() => { setShowAdd(false); setEditUser(null); }} footer={modalFooter}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-grid">
              {field('name', 'Full Name')}
              {field('email', 'Email Address', 'email')}
              {field('password', 'Password', 'password')}
              <div className="form-group">
                <label className="form-label">Phone Number (include country code, e.g. +91)</label>
                <input type="tel" className="input" placeholder="+91 98765..." value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
              </div>

              <CreatableSelect
                label="Department"
                value={form.department}
                options={departments}
                onChange={v => setForm(f => ({ ...f, department: v }))}
                onAdd={handleAddDept}
              />

              <CreatableSelect
                label="Position"
                value={form.position}
                options={positions}
                onChange={v => setForm(f => ({ ...f, position: v }))}
                onAdd={handleAddPos}
              />

              {field('joinDate', 'Join Date', 'date')}
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <Modal
          title="Remove Employee"
          onClose={() => setConfirmDelete(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} style={{ background: 'var(--red)', color: '#fff' }}>Yes, Remove</button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center', padding: '0.5rem 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={24} style={{ color: 'var(--red)' }} />
            </div>
            <div>
              <p style={{ fontWeight: 600, marginBottom: '0.3rem' }}>Remove {confirmDelete.name}?</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>This action cannot be undone. All data linked to this employee will remain but they will no longer be able to login.</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
