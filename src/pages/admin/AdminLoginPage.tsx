import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '@/lib/admin-auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Flame, Lock, Mail, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [setupMode, setSetupMode] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: loginError } = await adminLogin(email, password);
    if (loginError) {
      setError(loginError);
      setLoading(false);
    } else {
      navigate('/admin/orders');
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('setup-admin', {
        body: { email, password },
      });
      if (fnError) throw fnError;
      if (data?.error) {
        setError(data.error);
        setLoading(false);
        return;
      }
      toast.success('Owner account created! Signing in...');
      // Now sign in
      const { error: loginErr } = await adminLogin(email, password);
      if (loginErr) {
        setError(loginErr);
        setLoading(false);
      } else {
        navigate('/admin/orders');
      }
    } catch (err: any) {
      setError(err?.message || 'Setup failed');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-sm animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Flame className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-display text-2xl">
            {setupMode ? 'Create Owner Account' : 'Admin Login'}
          </CardTitle>
          <CardDescription>
            {setupMode ? 'Set up the first admin (owner) account' : 'Sign in with your admin credentials'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={setupMode ? handleSetup : handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@restaurant.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder={setupMode ? 'Choose a strong password' : 'Enter your password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  className="pl-9"
                  required
                  minLength={6}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (setupMode ? 'Creating...' : 'Signing in...') : (setupMode ? 'Create Owner Account' : 'Sign In')}
            </Button>
          </form>
          <button
            type="button"
            className="mt-4 flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => { setSetupMode(!setupMode); setError(''); }}
          >
            <UserPlus className="h-3 w-3" />
            {setupMode ? 'Back to login' : 'First time? Set up owner account'}
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoginPage;
