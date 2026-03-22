import type { TaskStatus, TaskPriority, LeaveStatus, AttendanceStatus } from '@/types';

interface BadgeProps { label: string; variant: string; }

export function Badge({ label, variant }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{label}</span>;
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const map: Record<TaskStatus, [string, string]> = {
    pending:     ['Pending',     'yellow'],
    'in-progress': ['In Progress', 'blue'],
    completed:   ['Completed',   'green'],
  };
  const [label, variant] = map[status];
  return <Badge label={label} variant={variant} />;
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const map: Record<TaskPriority, [string, string]> = {
    low:    ['Low',    'gray'],
    medium: ['Medium', 'yellow'],
    high:   ['High',   'red'],
  };
  const [label, variant] = map[priority];
  return <Badge label={label} variant={variant} />;
}

export function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  const map: Record<LeaveStatus, [string, string]> = {
    pending:  ['Pending',  'yellow'],
    approved: ['Approved', 'green'],
    rejected: ['Rejected', 'red'],
  };
  const [label, variant] = map[status];
  return <Badge label={label} variant={variant} />;
}

export function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  const map: Record<AttendanceStatus, [string, string]> = {
    present:  ['Present',  'green'],
    absent:   ['Absent',   'red'],
    'half-day': ['Half Day', 'yellow'],
    leave:    ['On Leave', 'blue'],
  };
  const [label, variant] = map[status];
  return <Badge label={label} variant={variant} />;
}
