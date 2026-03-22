export type Role = 'admin' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  department: string;
  position: string;
  phone: string;
  joinDate: string;
  avatar?: string;
}

export type TaskStatus = 'pending' | 'in-progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // user id
  assignedBy: string; // user id
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string; // ISO date string
  createdAt: string;
  updatedAt: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'half-day' | 'leave';

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  checkIn?: string; // HH:mm
  checkOut?: string; // HH:mm
  status: AttendanceStatus;
  workingHours?: number;
}

export type LeaveType = 'sick' | 'casual' | 'earned' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  userId: string;
  fromDate: string;
  toDate: string;
  reason: string;
  type: LeaveType;
  status: LeaveStatus;
  appliedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface AuthSession {
  userId: string;
  role: Role;
  name: string;
  email: string;
}
