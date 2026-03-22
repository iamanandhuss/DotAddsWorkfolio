'use client';

import type { User, Task, AttendanceRecord, LeaveRequest } from '@/types';
import { SEED_USERS } from './seed';

const KEYS = {
  users: 'ems_users',
  tasks: 'ems_tasks',
  attendance: 'ems_attendance',
  leaves: 'ems_leaves',
  seeded: 'ems_seeded_v3', // Changed to force re-seed and flush old dummy data
};

function get<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(key) || '[]') as T[];
  } catch {
    return [];
  }
}

function set<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

export function ensureSeeded(): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(KEYS.seeded)) return;
  
  // Only keep the admin user for live deployment
  const adminUser = SEED_USERS.find(u => u.role === 'admin');
  set(KEYS.users, adminUser ? [adminUser] : []);
  
  // Empty arrays for everything else
  set(KEYS.tasks, []);
  set(KEYS.attendance, []);
  set(KEYS.leaves, []);
  
  localStorage.setItem(KEYS.seeded, '1');
}

// ─── Users ───────────────────────────────────────────────────────────────────
export const getUsers = (): User[] => get<User>(KEYS.users);
export const getUserById = (id: string): User | undefined => getUsers().find(u => u.id === id);

export const addUser = (user: User): void => {
  const users = getUsers();
  users.push(user);
  set(KEYS.users, users);
};

export const updateUser = (updated: User): void => {
  const users = getUsers().map(u => (u.id === updated.id ? updated : u));
  set(KEYS.users, users);
};

export const deleteUser = (id: string): void => {
  set(KEYS.users, getUsers().filter(u => u.id !== id));
};

// ─── Tasks ───────────────────────────────────────────────────────────────────
export const getTasks = (): Task[] => get<Task>(KEYS.tasks);
export const getTasksByUser = (userId: string): Task[] => getTasks().filter(t => t.assignedTo === userId);

export const addTask = (task: Task): void => {
  const tasks = getTasks();
  tasks.push(task);
  set(KEYS.tasks, tasks);
};

export const updateTask = (updated: Task): void => {
  set(KEYS.tasks, getTasks().map(t => (t.id === updated.id ? updated : t)));
};

export const deleteTask = (id: string): void => {
  set(KEYS.tasks, getTasks().filter(t => t.id !== id));
};

// ─── Attendance ───────────────────────────────────────────────────────────────
export const getAttendance = (): AttendanceRecord[] => get<AttendanceRecord>(KEYS.attendance);
export const getAttendanceByUser = (userId: string): AttendanceRecord[] =>
  getAttendance().filter(a => a.userId === userId);

export const getTodayAttendance = (userId: string): AttendanceRecord | undefined => {
  const today = new Date().toISOString().split('T')[0];
  return getAttendance().find(a => a.userId === userId && a.date === today);
};

export const saveAttendance = (record: AttendanceRecord): void => {
  const all = getAttendance();
  const idx = all.findIndex(a => a.id === record.id);
  if (idx >= 0) all[idx] = record;
  else all.push(record);
  set(KEYS.attendance, all);
};

export const deleteAttendance = (id: string): void => {
  set(KEYS.attendance, getAttendance().filter(a => a.id !== id));
};

// ─── Leaves ───────────────────────────────────────────────────────────────────
export const getLeaves = (): LeaveRequest[] => get<LeaveRequest>(KEYS.leaves);
export const getLeavesByUser = (userId: string): LeaveRequest[] =>
  getLeaves().filter(l => l.userId === userId);

export const addLeave = (leave: LeaveRequest): void => {
  const leaves = getLeaves();
  leaves.push(leave);
  set(KEYS.leaves, leaves);
};

export const updateLeave = (updated: LeaveRequest): void => {
  set(KEYS.leaves, getLeaves().map(l => (l.id === updated.id ? updated : l)));
};

// ─── Utility ─────────────────────────────────────────────────────────────────
export const generateId = (): string =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
