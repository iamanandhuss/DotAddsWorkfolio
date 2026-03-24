'use client';

import type { AuthSession, User } from '@/types';
import { getUsers } from './store';
import bcrypt from 'bcryptjs';

const SESSION_KEY = 'ems_session';

export async function login(email: string, password: string): Promise<AuthSession | null> {
  const users = await getUsers();
  let user: User | undefined;

  for (const u of users) {
    if (u.email === email) {
      const isBcryptHash = u.password.startsWith('$2a$') || u.password.startsWith('$2b$') || u.password.startsWith('$2y$');
      
      let isValid = false;
      if (isBcryptHash) {
        isValid = bcrypt.compareSync(password, u.password);
      } else {
        isValid = u.password === password;
      }

      if (isValid) {
        user = u;
        break;
      }
    }
  }

  if (!user) return null;
  const session: AuthSession = {
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function requireAdmin(): boolean {
  const session = getSession();
  return session?.role === 'admin';
}
