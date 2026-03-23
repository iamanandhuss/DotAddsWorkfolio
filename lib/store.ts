import { supabase } from '@/utils/supabase/client';
import type { User, Task, AttendanceRecord, LeaveRequest, AppNotification } from '@/types';
import { SEED_USERS } from './seed';

// ─── Utility Data Mappers ──────────────────────────────────────────────────
const mapUser = (row: any): User => ({
  id: row.id,
  name: row.name,
  email: row.email,
  password: row.password,
  role: row.role,
  department: row.department || '',
  position: row.position || '',
  phone: row.phone || '',
  joinDate: row.join_date || '',
  avatar: row.avatar || undefined,
});

const mapTask = (row: any): Task => ({
  id: row.id,
  title: row.title,
  description: row.description || '',
  assignedTo: row.assigned_to,
  assignedBy: row.assigned_by,
  status: row.status,
  priority: row.priority,
  deadline: row.deadline,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapAttendance = (row: any): AttendanceRecord => ({
  id: row.id,
  userId: row.user_id,
  date: row.date,
  checkIn: row.check_in || undefined,
  checkOut: row.check_out || undefined,
  status: row.status,
  workingHours: row.working_hours ? Number(row.working_hours) : undefined,
});

const mapLeave = (row: any): LeaveRequest => ({
  id: row.id,
  userId: row.user_id,
  fromDate: row.from_date,
  toDate: row.to_date,
  reason: row.reason,
  type: row.type,
  status: row.status,
  appliedAt: row.applied_at,
  reviewedBy: row.reviewed_by || undefined,
  reviewedAt: row.reviewed_at || undefined,
});

const mapNotification = (row: any): AppNotification => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  message: row.message,
  type: row.type,
  isRead: row.is_read,
  createdAt: row.created_at,
});

export async function ensureSeeded(): Promise<void> {
  const { data: users } = await supabase.from('users').select('id').limit(1);
  if (!users || users.length === 0) {
    const adminUser = SEED_USERS.find(u => u.role === 'admin');
    if (adminUser) {
      await addUser(adminUser);
    }
  }
}

// ─── Users ───────────────────────────────────────────────────────────────────
export const getUsers = async (): Promise<User[]> => {
  const { data } = await supabase.from('users').select('*');
  return (data || []).map(mapUser);
};

export const getUserById = async (id: string): Promise<User | undefined> => {
  const { data } = await supabase.from('users').select('*').eq('id', id).single();
  return data ? mapUser(data) : undefined;
};

export const addUser = async (user: User): Promise<void> => {
  await supabase.from('users').insert([{
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.password,
    role: user.role,
    department: user.department,
    position: user.position,
    phone: user.phone,
    join_date: user.joinDate,
    avatar: user.avatar,
  }]);
};

export const updateUser = async (updated: User): Promise<void> => {
  await supabase.from('users').update({
    name: updated.name,
    email: updated.email,
    password: updated.password,
    role: updated.role,
    department: updated.department,
    position: updated.position,
    phone: updated.phone,
    join_date: updated.joinDate,
    avatar: updated.avatar,
  }).eq('id', updated.id);
};

export const deleteUser = async (id: string): Promise<void> => {
  await supabase.from('users').delete().eq('id', id);
};

// ─── Tasks ───────────────────────────────────────────────────────────────────
export const getTasks = async (): Promise<Task[]> => {
  const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
  return (data || []).map(mapTask);
};

export const getTasksByUser = async (userId: string): Promise<Task[]> => {
  const { data } = await supabase.from('tasks').select('*').eq('assigned_to', userId).order('created_at', { ascending: false });
  return (data || []).map(mapTask);
};

export const addTask = async (task: Task): Promise<void> => {
  await supabase.from('tasks').insert([{
    id: task.id,
    title: task.title,
    description: task.description,
    assigned_to: task.assignedTo,
    assigned_by: task.assignedBy,
    status: task.status,
    priority: task.priority,
    deadline: task.deadline,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
  }]);

  if (typeof window !== 'undefined') {
    fetch('/api/notify/task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: task.id })
    }).catch(err => console.error('Failed to trigger Email notification:', err));
  }
};

export const updateTask = async (updated: Task): Promise<void> => {
  await supabase.from('tasks').update({
    title: updated.title,
    description: updated.description,
    assigned_to: updated.assignedTo,
    assigned_by: updated.assignedBy,
    status: updated.status,
    priority: updated.priority,
    deadline: updated.deadline,
    updated_at: updated.updatedAt,
  }).eq('id', updated.id);
};

export const deleteTask = async (id: string): Promise<void> => {
  await supabase.from('tasks').delete().eq('id', id);
};

// ─── Attendance ───────────────────────────────────────────────────────────────
export const getAttendance = async (): Promise<AttendanceRecord[]> => {
  const { data } = await supabase.from('attendance_records').select('*');
  return (data || []).map(mapAttendance);
};

export const getAttendanceByUser = async (userId: string): Promise<AttendanceRecord[]> => {
  const { data } = await supabase.from('attendance_records').select('*').eq('user_id', userId);
  return (data || []).map(mapAttendance);
};

export const getTodayAttendance = async (userId: string): Promise<AttendanceRecord | undefined> => {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase.from('attendance_records').select('*').eq('user_id', userId).eq('date', today).maybeSingle();
  if (error || !data) return undefined;
  return mapAttendance(data);
};

export const saveAttendance = async (record: AttendanceRecord): Promise<void> => {
  const { data: existing } = await supabase.from('attendance_records').select('id').eq('id', record.id).maybeSingle();
  
  const payload = {
    id: record.id,
    user_id: record.userId,
    date: record.date,
    check_in: record.checkIn,
    check_out: record.checkOut,
    status: record.status,
    working_hours: record.workingHours,
  };

  if (existing) {
    await supabase.from('attendance_records').update(payload).eq('id', record.id);
  } else {
    await supabase.from('attendance_records').insert([payload]);
  }
};

export const deleteAttendance = async (id: string): Promise<void> => {
  await supabase.from('attendance_records').delete().eq('id', id);
};

// ─── Leaves ───────────────────────────────────────────────────────────────────
export const getLeaves = async (): Promise<LeaveRequest[]> => {
  const { data } = await supabase.from('leave_requests').select('*');
  return (data || []).map(mapLeave);
};

export const getLeavesByUser = async (userId: string): Promise<LeaveRequest[]> => {
  const { data } = await supabase.from('leave_requests').select('*').eq('user_id', userId);
  return (data || []).map(mapLeave);
};

export const addLeave = async (leave: LeaveRequest): Promise<void> => {
  await supabase.from('leave_requests').insert([{
    id: leave.id,
    user_id: leave.userId,
    from_date: leave.fromDate,
    to_date: leave.toDate,
    reason: leave.reason,
    type: leave.type,
    status: leave.status,
    applied_at: leave.appliedAt,
    reviewed_by: leave.reviewedBy,
    reviewed_at: leave.reviewedAt,
  }]);
};

export const updateLeave = async (updated: LeaveRequest): Promise<void> => {
  await supabase.from('leave_requests').update({
    from_date: updated.fromDate,
    to_date: updated.toDate,
    reason: updated.reason,
    type: updated.type,
    status: updated.status,
    reviewed_by: updated.reviewedBy,
    reviewed_at: updated.reviewedAt,
  }).eq('id', updated.id);
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const getNotifications = async (userId: string): Promise<AppNotification[]> => {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return (data || []).map(mapNotification);
};

export const addNotification = async (notif: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>): Promise<void> => {
  await supabase.from('notifications').insert([{
    user_id: notif.userId,
    title: notif.title,
    message: notif.message,
    type: notif.type,
    is_read: false,
  }]);
};

export const markNotificationRead = async (id: string): Promise<void> => {
  await supabase.from('notifications').update({ is_read: true }).eq('id', id);
};

// ─── Utility ─────────────────────────────────────────────────────────────────
export const generateId = (): string =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
