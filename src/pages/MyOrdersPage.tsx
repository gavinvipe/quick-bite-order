import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '@/hooks/use-customer-auth';
import { supabase } from '@/integrations/supabase/client';
import { getGuestOrderIds } from '@/lib/guest-orders';
import type { Order, OrderStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, Clock, ChefHat, Truck, CheckCircle2, XCircle, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pending',
  preparing: 'Preparing',
  out_for_delivery: 'Out for Delivery',
  completed: 'Delivered',
  cancelled: 'Cancelled',
};

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  preparing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  out_for_delivery: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

function mapRow(row: any): Order {
  return {
    id: row.id,
    items: row.items as Order['items'],
    customer: {
      fullName: row.customer_name,
      phone: row.customer_phone,
      address: row.customer_address,
      notes: row.customer_notes,
    },
    paymentMethod: row.payment_method,
    status: row.status as OrderStatus,
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.delivery_fee),
    total: Number(row.total),
    createdAt: row.created_at,
  };
}

const MyOrdersPage = () => {
  const { user, loading: authLoading, signOut } = useCustomerAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (fetched && !user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    
    const fetchOrders = async () => {
      setLoading(true);
      let allOrders: Order[] = [];

      if (user) {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (data) allOrders = data.map(mapRow);
      }

      const guestIds = getGuestOrderIds();
      if (guestIds.length > 0) {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .in('id', guestIds)
          .order('created_at', { ascending: false });
        if (data) {
          const guestOrders = data.map(mapRow);
          const existingIds = new Set(allOrders.map(o => o.id));
          for (const o of guestOrders) {
            if (!existingIds.has(o.id)) allOrders.push(o);
          }
        }
      }

      allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (!cancelled) {
        setOrders(allOrders);
        setLoading(false);
        setFetched(true);
      }
    };

    fetchOrders();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const activeOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.status));
  const pastOrders = orders.filter(o => ['completed', 'cancelled'].includes(o.status));

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">My Orders</h1>
          {user && <p className="text-sm text-muted-foreground">{user.email}</p>}
        </div>
        {user ? (
          <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        ) : (
          <Link to="/auth">
            <Button variant="outline" size="sm">Sign In for Full History</Button>
          </Link>
        )}
      </div>

      {loading ? (
        <p className="py-12 text-center text-muted-foreground">Loading orders...</p>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Package className="h-12 w-12 text-muted-foreground/30" />
            <p className="font-medium">No orders yet</p>
            <p className="text-sm text-muted-foreground">Your orders will appear here automatically.</p>
            <Link to="/menu"><Button className="mt-2">Browse Menu</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {activeOrders.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-xl font-semibold">Active Orders</h2>
              <div className="space-y-3">
                {activeOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </section>
          )}
          {pastOrders.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-xl font-semibold">Order History</h2>
              <div className="space-y-3">
                {pastOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {!user && orders.length > 0 && (
        <div className="mt-6 rounded-lg border bg-muted/50 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Can't find your order? <Link to="/track" className="text-primary hover:underline">Look it up by phone number</Link>
          </p>
        </div>
      )}
    </div>
  );
};

function OrderCard({ order }: { order: Order }) {
  return (
    <Link to={`/track?id=${order.id}`}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardContent className="flex items-center justify-between p-4">
          <div className="space-y-1">
            <p className="font-mono text-sm font-medium">{order.id}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-bold text-primary">${order.total.toFixed(2)}</span>
            <Badge className={cn('border-0 text-xs', statusColors[order.status])}>
              {statusLabels[order.status]}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default MyOrdersPage;
