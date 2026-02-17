import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export async function resolveSessionUser(timeoutMs = 1200): Promise<User | null> {
  const startedAt = Date.now();
  const pollEveryMs = 220;

  const readSessionUser = async (): Promise<User | null> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.user ?? null;
  };

  const directUser = await readSessionUser();
  if (directUser) return directUser;

  return new Promise((resolve) => {
    let settled = false;
    let pollTimer: number | null = null;
    let unsubscribe = () => {};

    const finish = (user: User | null) => {
      if (settled) return;
      settled = true;
      unsubscribe();
      if (pollTimer !== null) window.clearInterval(pollTimer);
      resolve(user);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (nextSession?.user) finish(nextSession.user);
    });
    unsubscribe = () => subscription.unsubscribe();

    pollTimer = window.setInterval(async () => {
      const elapsed = Date.now() - startedAt;
      if (elapsed >= timeoutMs) {
        finish(null);
        return;
      }

      const user = await readSessionUser();
      if (user) finish(user);
    }, pollEveryMs);
  });
}

export function getPreferredName(user: User | null, fallback = 'Docente'): string {
  if (!user) return fallback;

  const fullName = user.user_metadata?.full_name;
  const firstNameRaw = typeof fullName === 'string' ? fullName.split(' ')[0].trim() : '';
  const emailPrefix = typeof user.email === 'string' ? user.email.split('@')[0].trim() : '';

  return firstNameRaw || emailPrefix || fallback;
}
