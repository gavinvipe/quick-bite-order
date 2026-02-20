import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getOrderById, getOrdersByPhone } from '@/lib/orders';
import { getGuestOrderIds } from '@/lib/guest-orders';
import { useCustomerAuth } from '@/hooks/use-customer-auth';
import type { Order, OrderStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Package, Clock, ChefHat, Truck, CheckCircle2, XCircle, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusSteps: { status: OrderStatus; icon: typeof Clock; label: string }[] = [
  { status: 'pending', icon: Clock, label: 'Order Placed' },
  { status: 'preparing', icon: ChefHat, label: 'Preparing' },
  { status: 'out_for_delivery', icon: Truck, label: 'Out for Delivery' },
  { status: 'completed', icon: CheckCircle2, label: 'Delivered' },
];

const statusIndex: Record<OrderStatus, number> = {
  pending: 0,
  preparing: 1,
  out_for_delivery: 2,
  completed: 3,
  cancelled: -1,
};

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

const TrackOrderPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useCustomerAuth();
  const [orderId, setOrderId] = useState(searchParams.get('id') ?? '');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Phone recovery state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneOrders, setPhoneOrders] = useState<Order[]>([]);
  const [phoneSearched, setPhoneSearched] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);

  // Auto-loaded recent orders
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);

  const fetchOrder = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setSearched(true);
    const o = await getOrderById(id.trim());
    setOrder(o ?? null);
    setLoading(false);
  };

  // Auto-load recent orders from localStorage/auth
  useEffect(() => {
    const loadRecent = async () => {
      setRecentLoading(true);
      let orders: Order[] = [];

      // Load from localStorage
      const guestIds = getGuestOrderIds();
      if (guestIds.length > 0) {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .in('id', guestIds.slice(0, 10))
          .order('created_at', { ascending: false });
        if (data) {
          orders = data.map((row: any) => ({
            id: row.id,
            items: row.items,
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
          }));
        }
      }

      // Also load user orders if logged in
      if (user) {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
        if (data) {
          const userOrders = data.map((row: any) => ({
            id: row.id,
            items: row.items,
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
          }));
          const existingIds = new Set(orders.map(o => o.id));
          for (const o of userOrders) {
            if (!existingIds.has(o.id)) orders.push(o);
          }
        }
      }

      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentOrders(orders);
      setRecentLoading(false);
    };
    loadRecent();
  }, [user]);

  // Auto-search from URL param
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) fetchOrder(id);
  }, []);

  // Real-time updates for the tracked order
  useEffect(() => {
    if (!order) return;
    const channel = supabase
      .channel(`track-${order.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${order.id}` },
        () => fetchOrder(order.id)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [order?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ id: orderId });
    fetchOrder(orderId);
  };

  const handlePhoneLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    setPhoneLoading(true);
    setPhoneSearched(true);
    const orders = await getOrdersByPhone(phoneNumber.trim());
    setPhoneOrders(orders);
    setPhoneLoading(false);
  };

  const currentStep = order ? statusIndex[order.status] : -1;

  return (
    <div className="container max-w-lg py-12">
      <div className="mb-8 text-center">
        <Package className="mx-auto mb-3 h-10 w-10 text-primary" />
        <h1 className="font-display text-3xl font-bold">Track Your Order</h1>
        <p className="mt-1 text-muted-foreground">View your orders or look them up</p>
      </div>

      {/* Recent orders auto-loaded */}
      {!order && !recentLoading && recentOrders.length > 0 && (
        <div className="mb-8 space-y-3">
          <h2 className="font-display text-lg font-semibold">Your Recent Orders</h2>
          {recentOrders.slice(0, 5).map(o => (
            <Card
              key={o.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => { setOrder(o); setSearchParams({ id: o.id }); setSearched(true); }}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-mono text-sm font-medium">{o.id}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary">${o.total.toFixed(2)}</span>
                  <Badge className={cn('border-0 text-xs', statusColors[o.status])}>
                    {statusLabels[o.status]}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Search tabs */}
      {!order && (
        <Tabs defaultValue="id" className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="id">By Order ID</TabsTrigger>
            <TabsTrigger value="phone">By Phone Number</TabsTrigger>
          </TabsList>

          <TabsContent value="id">
            <form onSubmit={handleSubmit} className="flex gap-2 pt-2">
              <div className="flex-1">
                <Label htmlFor="orderId" className="sr-only">Order ID</Label>
                <Input
                  id="orderId"
                  placeholder="e.g. FK-ABC123"
                  value={orderId}
                  onChange={e => setOrderId(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={loading}>
                <Search className="mr-2 h-4 w-4" /> Track
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="phone">
            <form onSubmit={handlePhoneLookup} className="flex gap-2 pt-2">
              <div className="flex-1">
                <Label htmlFor="phone" className="sr-only">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+233 24 000 0000"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={phoneLoading}>
                <Phone className="mr-2 h-4 w-4" /> Find
              </Button>
            </form>

            {phoneLoading && <p className="mt-4 text-center text-muted-foreground">Searching...</p>}

            {phoneSearched && !phoneLoading && phoneOrders.length === 0 && (
              <Card className="mt-4">
                <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
                  <XCircle className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No orders found for this phone number.</p>
                </CardContent>
              </Card>
            )}

            {phoneOrders.length > 0 && (
              <div className="mt-4 space-y-2">
                {phoneOrders.map(o => (
                  <Card
                    key={o.id}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() => { setOrder(o); setSearchParams({ id: o.id }); setSearched(true); }}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-mono text-sm font-medium">{o.id}</p>
                        <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">${o.total.toFixed(2)}</span>
                        <Badge className={cn('border-0 text-xs', statusColors[o.status])}>
                          {statusLabels[o.status]}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {loading && <p className="text-center text-muted-foreground">Looking up order...</p>}

      {searched && !loading && !order && !phoneOrders.length && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <XCircle className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">Order not found</p>
            <p className="text-sm text-muted-foreground">Double-check the order ID and try again.</p>
          </CardContent>
        </Card>
      )}

      {order && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => { setOrder(null); setSearched(false); setSearchParams({}); }}
          >
            ← Back to search
          </Button>

          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="font-mono text-sm">{order.id}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {order.status === 'cancelled' ? (
                <div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-4">
                  <XCircle className="h-6 w-6 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">Order Cancelled</p>
                    <p className="text-sm text-muted-foreground">This order has been cancelled.</p>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between">
                  {statusSteps.map((step, i) => {
                    const active = i <= currentStep;
                    const Icon = step.icon;
                    return (
                      <div key={step.status} className="flex flex-1 flex-col items-center gap-1">
                        <div className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                          active ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30 text-muted-foreground/40'
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className={cn('text-xs text-center', active ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <Separator />

              <div className="space-y-2 text-sm">
                {order.items.map(({ menuItem, quantity }) => (
                  <div key={menuItem.id} className="flex justify-between">
                    <span>{menuItem.name} × {quantity}</span>
                    <span>${(menuItem.price * quantity).toFixed(2)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">${order.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-sm">
                <p className="text-muted-foreground">Delivering to:</p>
                <p className="font-medium">{order.customer.address}</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <div className="mt-8 text-center">
        <Link to="/menu">
          <Button variant="outline">Back to Menu</Button>
        </Link>
      </div>
    </div>
  );
};

export default TrackOrderPage;
