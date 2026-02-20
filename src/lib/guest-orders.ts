const GUEST_ORDERS_KEY = 'guest_order_ids';

export function getGuestOrderIds(): string[] {
  try {
    const raw = localStorage.getItem(GUEST_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addGuestOrderId(orderId: string): void {
  const ids = getGuestOrderIds();
  if (!ids.includes(orderId)) {
    ids.unshift(orderId);
    // Keep last 50 orders max
    localStorage.setItem(GUEST_ORDERS_KEY, JSON.stringify(ids.slice(0, 50)));
  }
}
