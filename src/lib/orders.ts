import { supabase } from '@/integrations/supabase/client';
import type { Order, OrderStatus } from '@/types';

export async function saveOrder(order: Order): Promise<void> {
  const { error } = await supabase.from('orders').insert({
    id: order.id,
    items: order.items as any,
    customer_name: order.customer.fullName,
    customer_phone: order.customer.phone,
    customer_address: order.customer.address,
    customer_notes: order.customer.notes ?? null,
    payment_method: order.paymentMethod,
    status: order.status,
    subtotal: order.subtotal,
    delivery_fee: order.deliveryFee,
    total: order.total,
  });
  if (error) throw error;
}

export async function getOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
  return (data ?? []).map(mapRowToOrder);
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return undefined;
  return mapRowToOrder(data);
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
  if (error) throw error;
}

function mapRowToOrder(row: any): Order {
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

export function generateOrderId(): string {
  return 'FK-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
}
