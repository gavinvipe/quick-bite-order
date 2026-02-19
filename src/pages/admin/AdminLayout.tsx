import { Navigate, Outlet, Link } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { adminLogout } from '@/lib/admin-auth';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
import { ClipboardList, UtensilsCrossed, LogOut, Flame, Home, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const AdminLayout = () => {
  const { user, roles, loading, hasRole } = useAdminAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user || roles.length === 0) {
    return <Navigate to="/admin/login" replace />;
  }

  const navItems = [
    { title: 'Orders', url: '/admin/orders', icon: ClipboardList },
    ...(hasRole('owner', 'manager')
      ? [{ title: 'Menu Items', url: '/admin/menu', icon: UtensilsCrossed }]
      : []),
    ...(hasRole('owner')
      ? [{ title: 'Staff', url: '/admin/staff', icon: Users }]
      : []),
  ];

  const handleLogout = async () => {
    await adminLogout();
    navigate('/admin/login');
  };

  const roleLabel = roles[0]?.charAt(0).toUpperCase() + roles[0]?.slice(1);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon">
          <div className="flex h-14 items-center gap-2 border-b px-4">
            <Flame className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-bold">Admin</span>
            <Badge variant="secondary" className="ml-auto text-xs">{roleLabel}</Badge>
          </div>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map(item => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end
                          className="hover:bg-muted/50"
                          activeClassName="bg-muted text-primary font-medium"
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="mt-auto space-y-2 border-t p-4">
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              <Link to="/">
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                  <Home className="h-4 w-4" /> View Site
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-destructive hover:text-destructive" onClick={handleLogout}>
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger />
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
