import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getOrderById } from '@/lib/orders';
import type { Order, OrderStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Search, Package, Clock, ChefHat, Truck, CheckCircle2, XCircle } from 'lucide-react';
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

const TrackOrderPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('id') ?? '');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchOrder = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setSearched(true);
    const o = await getOrderById(id.trim());
    setOrder(o ?? null);
    setLoading(false);
  };

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

  const currentStep = order ? statusIndex[order.status] : -1;

  return (
    <div className="container max-w-lg py-12">
      <div className="mb-8 text-center">
        <Package className="mx-auto mb-3 h-10 w-10 text-primary" />
        <h1 className="font-display text-3xl font-bold">Track Your Order</h1>
        <p className="mt-1 text-muted-foreground">Enter your order ID to see the latest status</p>
      </div>

      <form onSubmit={handleSubmit} className="mb-8 flex gap-2">
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

      {loading && <p className="text-center text-muted-foreground">Looking up order...</p>}

      {searched && !loading && !order && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <XCircle className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">Order not found</p>
            <p className="text-sm text-muted-foreground">Double-check the order ID and try again.</p>
          </CardContent>
        </Card>
      )}

      {order && (
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
            {/* Status tracker */}
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

            {/* Order items */}
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
