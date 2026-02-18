import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCart } from '@/hooks/use-cart';
import { generateOrderId, saveOrder } from '@/lib/orders';
import type { Order, PaymentMethod } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Banknote, Smartphone, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const schema = z.object({
  fullName: z.string().trim().min(2, 'Name is required').max(100),
  phone: z.string().trim().min(7, 'Phone number is required').max(20),
  address: z.string().trim().min(5, 'Delivery address is required').max(300),
  notes: z.string().max(500).optional(),
  paymentMethod: z.enum(['cash', 'momo']),
  momoPhone: z.string().optional(),
}).refine(
  data => data.paymentMethod !== 'momo' || (data.momoPhone && data.momoPhone.trim().length >= 7),
  { message: 'MoMo phone number is required', path: ['momoPhone'] }
);

type FormData = z.infer<typeof schema>;

const CheckoutPage = () => {
  const { items, subtotal, deliveryFee, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: 'cash', notes: '', momoPhone: '' },
  });

  const paymentMethod = watch('paymentMethod');

  if (items.length === 0) {
    return (
      <div className="container flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Nothing to check out</h1>
        <p className="text-muted-foreground">Add items to your cart first.</p>
        <Link to="/menu">
          <Button>Browse Menu</Button>
        </Link>
      </div>
    );
  }

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const order: Order = {
        id: generateOrderId(),
        items: [...items],
        customer: {
          fullName: data.fullName,
          phone: data.phone,
          address: data.address,
          notes: data.notes,
        },
        paymentMethod: data.paymentMethod as PaymentMethod,
        status: 'pending',
        subtotal,
        deliveryFee,
        total,
        createdAt: new Date().toISOString(),
      };
      await saveOrder(order);
      clearCart();
      navigate(`/confirmation/${order.id}`);
    } catch (err) {
      console.error('Order failed:', err);
      toast.error('Failed to place order. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <Link to="/cart" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Cart
      </Link>
      <h1 className="mb-6 font-display text-3xl font-bold">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer Info */}
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <h2 className="font-display text-xl font-semibold">Delivery Details</h2>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input id="fullName" placeholder="John Doe" {...register('fullName')} />
            {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input id="phone" placeholder="+233 24 000 0000" {...register('phone')} />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Delivery Address *</Label>
            <Textarea id="address" placeholder="Enter your full delivery address" {...register('address')} />
            {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes / Instructions (optional)</Label>
            <Textarea
              id="notes"
              placeholder="E.g., No onions, ring doorbell, etc."
              {...register('notes')}
            />
          </div>
        </div>

        {/* Payment */}
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <h2 className="font-display text-xl font-semibold">Payment Method</h2>

          <RadioGroup
            value={paymentMethod}
            onValueChange={val => setValue('paymentMethod', val as PaymentMethod)}
            className="space-y-3"
          >
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
              <RadioGroupItem value="cash" />
              <Banknote className="h-5 w-5 text-accent" />
              <div>
                <p className="font-medium">Cash on Delivery</p>
                <p className="text-sm text-muted-foreground">Pay when your order arrives</p>
              </div>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
              <RadioGroupItem value="momo" />
              <Smartphone className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Mobile Money (MoMo)</p>
                <p className="text-sm text-muted-foreground">Send payment via mobile money</p>
              </div>
            </label>
          </RadioGroup>

          {paymentMethod === 'momo' && (
            <div className="space-y-3 rounded-lg bg-primary/5 p-4 animate-fade-in">
              <p className="text-sm font-medium">Pay to: <span className="text-primary">+233 20 000 0000</span></p>
              <p className="text-sm text-muted-foreground">Send ${total.toFixed(2)} to the number above, then enter your MoMo phone number below.</p>
              <div className="space-y-2">
                <Label htmlFor="momoPhone">Your MoMo Phone Number *</Label>
                <Input id="momoPhone" placeholder="+233 24 000 0000" {...register('momoPhone')} />
                {errors.momoPhone && <p className="text-sm text-destructive">{errors.momoPhone.message}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 font-display text-xl font-semibold">Order Summary</h2>
          <div className="space-y-2 text-sm">
            {items.map(({ menuItem, quantity }) => (
              <div key={menuItem.id} className="flex justify-between">
                <span>{menuItem.name} × {quantity}</span>
                <span>${(menuItem.price * quantity).toFixed(2)}</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span>{deliveryFee === 0 ? 'Free' : `$${deliveryFee.toFixed(2)}`}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span className="text-primary">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? 'Placing Order...' : 'Place Order'}
        </Button>
      </form>
    </div>
  );
};

export default CheckoutPage;
