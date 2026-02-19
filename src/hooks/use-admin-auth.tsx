import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getUserRoles, type AppRole } from '@/lib/admin-auth';
import type { User } from '@supabase/supabase-js';

interface AdminAuthState {
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  hasRole: (...roles: AppRole[]) => boolean;
}

const AdminAuthContext = createContext<AdminAuthState>({
  user: null,
  roles: [],
  loading: true,
  hasRole: () => false,
});

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const r = await getUserRoles(u.id);
        setRoles(r);
      } else {
        setRoles([]);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const r = await getUserRoles(u.id);
        setRoles(r);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const hasRole = (...required: AppRole[]) => roles.some(r => required.includes(r));

  return (
    <AdminAuthContext.Provider value={{ user, roles, loading, hasRole }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
