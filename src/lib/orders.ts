import type { Order, OrderStatus } from '@/types';

const ORDERS_KEY = 'flamekitchen_orders';

export function saveOrder(order: Order) {
  const orders = getOrders();
  orders.push(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function getOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getOrderById(id: string): Order | undefined {
  return getOrders().find(o => o.id === id);
}

export function updateOrderStatus(id: string, status: OrderStatus) {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx !== -1) orders[idx] = { ...orders[idx], status };
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  return orders;
}

export function generateOrderId(): string {
  return 'FK-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
}
