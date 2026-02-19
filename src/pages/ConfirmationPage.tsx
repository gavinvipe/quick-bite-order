import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getOrderById } from '@/lib/orders';
import type { Order } from '@/types';
import { CheckCircle2, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const ConfirmationPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      getOrderById(orderId).then(o => { setOrder(o); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, [orderId]);

  if (loading) {
    return <div className="container flex items-center justify-center py-24"><p>Loading...</p></div>;
  }

  if (!order) {
    return (
      <div className="container flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Order Not Found</h1>
        <Link to="/"><Button>Go Home</Button></Link>
      </div>
    );
  }

  return (
    <div className="container max-w-lg py-12">
      <div className="flex flex-col items-center gap-4 text-center animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <CheckCircle2 className="h-10 w-10 text-accent" />
        </div>
        <h1 className="font-display text-3xl font-bold">Order Confirmed!</h1>
        <p className="text-muted-foreground">Thank you, {order.customer.fullName}. Your order has been placed successfully.</p>
      </div>

      <div className="mt-8 space-y-4 rounded-xl border bg-card p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Order ID</span>
          <span className="font-mono font-bold text-primary">{order.id}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-warm/10 px-3 py-1 text-xs font-medium text-warm">
            <Clock className="h-3 w-3" />
            {order.paymentMethod === 'momo' ? 'Pending Payment Confirmation' : 'Pending'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Payment</span>
          <span className="text-sm font-medium">{order.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Mobile Money'}</span>
        </div>
        <Separator />
        <div className="space-y-2 text-sm">
          {order.items.map(({ menuItem, quantity }) => (
            <div key={menuItem.id} className="flex justify-between">
              <span>{menuItem.name} × {quantity}</span>
              <span>${(menuItem.price * quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <Separator />
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span className="text-primary">${order.total.toFixed(2)}</span>
        </div>
        <div className="text-sm">
          <p className="text-muted-foreground">Delivering to:</p>
          <p className="font-medium">{order.customer.address}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link to={`/track?id=${order.id}`}>
          <Button className="w-full gap-2 sm:w-auto">
            Track Order <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link to="/menu">
          <Button variant="outline" className="w-full gap-2 sm:w-auto">
            Order More <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ConfirmationPage;
