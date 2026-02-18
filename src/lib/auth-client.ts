import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './supabase';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

async function readSessionUser(): Promise<User | null> {
  try {
    const [{ data: userData }, { data: sessionData }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession(),
    ]);
    return userData.user ?? sessionData.session?.user ?? null;
  } catch (_error) {
    return null;
  }
}

export async function resolveSessionUser(timeoutMs = 6500): Promise<User | null> {
  if (typeof window === 'undefined') return null;
  if (!isSupabaseConfigured) return null;

  const directUser = await readSessionUser();
  if (directUser) {
    return directUser;
  }

  const pollEveryMs = 280;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    await wait(pollEveryMs);
    const nextUser = await readSessionUser();
    if (nextUser) {
      return nextUser;
    }
  }

  return null;
}

export function getSafeNextPath(nextPath: string | null | undefined, fallback = '/dashboard'): string {
  if (!nextPath) return fallback;

  const trimmed = nextPath.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback;

  return trimmed;
}

export function buildLoginRedirect(nextPath = '/dashboard'): string {
  const safePath = getSafeNextPath(nextPath);
  return `/login?next=${encodeURIComponent(safePath)}`;
}

export function getPreferredName(user: User | null, fallback = 'Docente'): string {
  if (!user) return fallback;

  const fullName = user.user_metadata?.full_name;
  const firstNameRaw = typeof fullName === 'string' ? fullName.split(' ')[0].trim() : '';
  const emailPrefix = typeof user.email === 'string' ? user.email.split('@')[0].trim() : '';

  return firstNameRaw || emailPrefix || fallback;
}
