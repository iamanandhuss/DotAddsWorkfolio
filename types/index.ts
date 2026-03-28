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

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'task_assigned' | 'status_change' | 'leave_request' | 'meeting_invite';
  isRead: boolean;
  createdAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  meetingLink: string;
  datetime: string; // ISO string
  createdBy: string; // user id
  createdAt: string;
  participants?: string[]; // array of user ids
}

export interface MeetingParticipant {
  id: string;
  meetingId: string;
  userId: string;
}

export interface TaskUpdate {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  note: string;
  statusAtUpdate: TaskStatus;
  createdAt: string;
  type: 'note' | 'status_change' | 'reply' | 'admin_note';
}
