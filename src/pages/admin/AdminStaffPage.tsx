import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { UserPlus, Users, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { AppRole } from '@/lib/admin-auth';

interface StaffMember {
  userId: string;
  email: string;
  role: AppRole;
}

const AdminStaffPage = () => {
  const { hasRole } = useAdminAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'manager' | 'staff'>('staff');
  const [invitePassword, setInvitePassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('user_roles').select('user_id, role');
    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    // Get user emails from auth - we need an edge function for this
    // For now, show user IDs. We'll use the invite function which returns emails.
    const members: StaffMember[] = (data ?? []).map(r => ({
      userId: r.user_id,
      email: r.user_id, // Will be replaced by actual email
      role: r.role as AppRole,
    }));
    setStaff(members);
    setLoading(false);
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !invitePassword) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-staff', {
        body: { email: inviteEmail, password: invitePassword, role: inviteRole },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Invited ${inviteEmail} as ${inviteRole}`);
      setInviteEmail('');
      setInvitePassword('');
      fetchStaff();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to invite');
    }
    setSubmitting(false);
  };

  const handleRemove = async (userId: string) => {
    try {
      const { error } = await supabase.from('user_roles').delete().eq('user_id', userId);
      if (error) throw error;
      toast.success('Role removed');
      fetchStaff();
    } catch {
      toast.error('Failed to remove');
    }
  };

  if (!hasRole('owner')) {
    return <p className="py-12 text-center text-muted-foreground">Only owners can manage staff.</p>;
  }

  const roleColor: Record<AppRole, string> = {
    owner: 'bg-primary/10 text-primary',
    manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    staff: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Staff Management</h1>
        <p className="text-sm text-muted-foreground">Invite and manage team members</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5" /> Invite Team Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="staff@restaurant.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label>Temporary Password</Label>
              <Input
                type="password"
                placeholder="Min 6 characters"
                value={invitePassword}
                onChange={e => setInvitePassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="w-full space-y-2 sm:w-36">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={v => setInviteRole(v as 'manager' | 'staff')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Inviting...' : 'Invite'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" /> Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-muted-foreground">Loading...</p>
          ) : staff.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No team members yet.</p>
          ) : (
            <div className="space-y-3">
              {staff.map(member => (
                <div key={member.userId} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <Badge className={`border-0 ${roleColor[member.role]}`}>
                      {member.role}
                    </Badge>
                    <span className="text-sm font-mono truncate max-w-[200px]">{member.userId}</span>
                  </div>
                  {member.role !== 'owner' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(member.userId)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStaffPage;
