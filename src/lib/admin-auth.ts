import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export type AppRole = 'owner' | 'manager' | 'staff';

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);
  if (error || !data) return [];
  return data.map(r => r.role as AppRole);
}

export async function isAdmin(userId: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.length > 0;
}

export function hasPermission(roles: AppRole[], required: AppRole[]): boolean {
  return roles.some(r => required.includes(r));
}

export async function adminLogin(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { user: null, error: error.message };
  
  // Verify user has an admin role
  const admin = await isAdmin(data.user.id);
  if (!admin) {
    await supabase.auth.signOut();
    return { user: null, error: 'Access denied. You do not have admin privileges.' };
  }
  
  return { user: data.user, error: null };
}

export async function adminLogout(): Promise<void> {
  await supabase.auth.signOut();
}
