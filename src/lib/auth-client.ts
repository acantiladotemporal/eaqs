import type { User } from '@supabase/supabase-js';
import { AUTH_PREVIEW_MODE, AUTH_PREVIEW_NAME } from './auth-config';
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

function getPreviewUser(): User {
  const previewEmail = `${AUTH_PREVIEW_NAME.toLowerCase().replace(/\s+/g, '.') || 'docente'}@preview.local`;

  return {
    id: 'preview-user',
    aud: 'authenticated',
    role: 'authenticated',
    email: previewEmail,
    email_confirmed_at: new Date().toISOString(),
    phone: '',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { full_name: AUTH_PREVIEW_NAME },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_anonymous: false,
  } as unknown as User;
}

export async function resolveSessionUser(timeoutMs = 6500): Promise<User | null> {
  if (typeof window === 'undefined') return null;
  if (AUTH_PREVIEW_MODE) return getPreviewUser();
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

export function animateNameSwap(target: Element | null, nextName: string): void {
  if (!(target instanceof HTMLElement)) return;

  const normalizedName = nextName.trim();
  if (!normalizedName) return;

  const currentName = (target.textContent ?? '').trim();
  if (currentName === normalizedName) return;

  target.classList.remove('is-ready');
  target.classList.add('is-swapping');

  globalThis.setTimeout(() => {
    target.textContent = normalizedName;
    target.classList.remove('is-swapping');
    target.classList.add('is-ready');
  }, 180);
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
