import { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus } from '@/lib/orders';
import type { Order, OrderStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ClipboardList, Phone, MapPin, Banknote, Smartphone, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  preparing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  out_for_delivery: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');

  const refresh = async () => {
    const data = await getOrders();
    setOrders(data);
  };

  useEffect(() => { refresh(); }, []);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, status);
      await refresh();
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Orders</h1>
          <p className="text-sm text-muted-foreground">{orders.length} total orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={v => setFilter(v as OrderStatus | 'all')}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              {statusOptions.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground/40" />
          <p className="font-medium">No orders found</p>
          <p className="text-sm text-muted-foreground">Orders will appear here as customers place them.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(order => (
            <Card key={order.id} className="animate-fade-in">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="font-mono text-sm">{order.id}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge className={cn('border-0 text-xs', statusColors[order.status])}>
                    {statusOptions.find(s => s.value === order.status)?.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{order.customer.fullName}</p>
                  <p className="flex items-center gap-1 text-muted-foreground">
                    <Phone className="h-3 w-3" /> {order.customer.phone}
                  </p>
                  <p className="flex items-start gap-1 text-muted-foreground">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0" /> {order.customer.address}
                  </p>
                  {order.customer.notes && (
                    <p className="text-xs italic text-muted-foreground">Note: {order.customer.notes}</p>
                  )}
                </div>

                <Separator />

                <div className="space-y-1 text-sm">
                  {order.items.map(({ menuItem, quantity }) => (
                    <div key={menuItem.id} className="flex justify-between">
                      <span>{menuItem.name} × {quantity}</span>
                      <span>${(menuItem.price * quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    {order.paymentMethod === 'cash' ? (
                      <><Banknote className="h-4 w-4 text-accent" /> Cash</>
                    ) : (
                      <><Smartphone className="h-4 w-4 text-primary" /> MoMo</>
                    )}
                  </span>
                  <span className="font-bold text-primary">${order.total.toFixed(2)}</span>
                </div>

                <Select
                  value={order.status}
                  onValueChange={v => handleStatusChange(order.id, v as OrderStatus)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
