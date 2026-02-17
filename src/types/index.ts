export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: MenuCategory;
  popular?: boolean;
  available?: boolean;
}

export type MenuCategory = 'starters' | 'mains' | 'drinks' | 'desserts';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  customer: CustomerInfo;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  total: number;
  notes?: string;
  createdAt: string;
}

export interface CustomerInfo {
  fullName: string;
  phone: string;
  address: string;
  notes?: string;
}

export type PaymentMethod = 'cash' | 'momo';
export type OrderStatus = 'pending' | 'preparing' | 'out_for_delivery' | 'completed' | 'cancelled';
