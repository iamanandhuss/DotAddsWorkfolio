import type { User, Task, AttendanceRecord, LeaveRequest } from '@/types';

export const SEED_USERS: User[] = [
  {
    id: 'u1',
    name: 'Admin User',
    email: 'vishnuroze1@gmail.com',
    password: 'admin123',
    role: 'admin',
    department: 'Management',
    position: 'System Administrator',
    phone: '+91 98765 00001',
    joinDate: '2022-01-01',
  },
  {
    id: 'u2',
    name: 'John Smith',
    email: 'john@dotads.com',
    password: 'emp123',
    role: 'employee',
    department: 'Design',
    position: 'UI/UX Designer',
    phone: '+91 98765 00002',
    joinDate: '2022-03-15',
  },
  {
    id: 'u3',
    name: 'Priya Sharma',
    email: 'priya@dotads.com',
    password: 'emp123',
    role: 'employee',
    department: 'Development',
    position: 'Frontend Developer',
    phone: '+91 98765 00003',
    joinDate: '2022-06-01',
  },
  {
    id: 'u4',
    name: 'Rahul Verma',
    email: 'rahul@dotads.com',
    password: 'emp123',
    role: 'employee',
    department: 'Marketing',
    position: 'Marketing Executive',
    phone: '+91 98765 00004',
    joinDate: '2023-01-10',
  },
];

const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const daysAgo = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return d; };

export const SEED_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Redesign Company Homepage',
    description: 'Update the website homepage with modern design and new brand guidelines.',
    assignedTo: 'u2',
    assignedBy: 'u1',
    status: 'in-progress',
    priority: 'high',
    deadline: fmt(daysAgo(-5)),
    createdAt: fmt(daysAgo(10)),
    updatedAt: fmt(daysAgo(2)),
  },
  {
    id: 't2',
    title: 'Build Employee Portal',
    description: 'Develop the employee self-service portal with attendance and leave features.',
    assignedTo: 'u3',
    assignedBy: 'u1',
    status: 'in-progress',
    priority: 'high',
    deadline: fmt(daysAgo(-3)),
    createdAt: fmt(daysAgo(14)),
    updatedAt: fmt(daysAgo(1)),
  },
  {
    id: 't3',
    title: 'Q1 Social Media Campaign',
    description: 'Plan and execute social media content for Q1.',
    assignedTo: 'u4',
    assignedBy: 'u1',
    status: 'completed',
    priority: 'medium',
    deadline: fmt(daysAgo(2)),
    createdAt: fmt(daysAgo(20)),
    updatedAt: fmt(daysAgo(2)),
  },
  {
    id: 't4',
    title: 'Brand Style Guide',
    description: 'Create a comprehensive brand style guide document.',
    assignedTo: 'u2',
    assignedBy: 'u1',
    status: 'pending',
    priority: 'medium',
    deadline: fmt(daysAgo(-10)),
    createdAt: fmt(daysAgo(5)),
    updatedAt: fmt(daysAgo(5)),
  },
  {
    id: 't5',
    title: 'Performance Report Q1',
    description: 'Compile and analyse performance metrics for Q1.',
    assignedTo: 'u3',
    assignedBy: 'u1',
    status: 'pending',
    priority: 'low',
    deadline: fmt(daysAgo(-7)),
    createdAt: fmt(daysAgo(3)),
    updatedAt: fmt(daysAgo(3)),
  },
];

export const SEED_ATTENDANCE: AttendanceRecord[] = [];
for (let i = 6; i >= 0; i--) {
  const date = fmt(daysAgo(i));
  const day = daysAgo(i).getDay();
  if (day === 0 || day === 6) continue; // skip weekends
  ['u2', 'u3', 'u4'].forEach((uid, idx) => {
    SEED_ATTENDANCE.push({
      id: `a-${uid}-${i}`,
      userId: uid,
      date,
      checkIn: `0${9 + idx}:00`,
      checkOut: `1${8 + idx}:30`,
      status: 'present',
      workingHours: 9.5,
    });
  });
}

export const SEED_LEAVES: LeaveRequest[] = [
  {
    id: 'l1',
    userId: 'u2',
    fromDate: fmt(daysAgo(-5)),
    toDate: fmt(daysAgo(-6)),
    reason: 'Family function',
    type: 'casual',
    status: 'pending',
    appliedAt: fmt(today),
  },
  {
    id: 'l2',
    userId: 'u3',
    fromDate: fmt(daysAgo(10)),
    toDate: fmt(daysAgo(10)),
    reason: 'Medical appointment',
    type: 'sick',
    status: 'approved',
    appliedAt: fmt(daysAgo(12)),
    reviewedBy: 'u1',
    reviewedAt: fmt(daysAgo(11)),
  },
  {
    id: 'l3',
    userId: 'u4',
    fromDate: fmt(daysAgo(20)),
    toDate: fmt(daysAgo(19)),
    reason: 'Personal work',
    type: 'casual',
    status: 'rejected',
    appliedAt: fmt(daysAgo(22)),
    reviewedBy: 'u1',
    reviewedAt: fmt(daysAgo(21)),
  },
];
