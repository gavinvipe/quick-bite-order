
-- Menu items table
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10,2) NOT NULL,
  image TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('starters', 'mains', 'drinks', 'desserts')),
  popular BOOLEAN NOT NULL DEFAULT false,
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders table
CREATE TABLE public.orders (
  id TEXT NOT NULL PRIMARY KEY,
  items JSONB NOT NULL DEFAULT '[]',
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_notes TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'momo')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'out_for_delivery', 'completed', 'cancelled')),
  subtotal NUMERIC(10,2) NOT NULL,
  delivery_fee NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Menu items: public read, admin managed via service role or open write for now
CREATE POLICY "Anyone can read menu items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert menu items" ON public.menu_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update menu items" ON public.menu_items FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete menu items" ON public.menu_items FOR DELETE USING (true);

-- Orders: public read/write (guest ordering, no auth)
CREATE POLICY "Anyone can read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Anyone can insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update orders" ON public.orders FOR UPDATE USING (true);

-- Seed menu items from existing data
INSERT INTO public.menu_items (name, description, price, image, category, popular, available) VALUES
  ('Jollof Rice', 'Smoky, spiced rice cooked in a rich tomato base with herbs and peppers', 12.99, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600', 'mains', true, true),
  ('Grilled Tilapia', 'Whole tilapia marinated in spices and grilled over charcoal', 15.99, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600', 'mains', true, true),
  ('Kelewele', 'Spicy fried plantain cubes seasoned with ginger and chili', 6.99, 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600', 'starters', true, true),
  ('Banku & Okro Stew', 'Fermented corn dough served with a rich okro stew', 13.99, 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600', 'mains', false, true),
  ('Waakye', 'Rice and beans cooked together, served with spaghetti, stew, and protein', 11.99, 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600', 'mains', true, true),
  ('Spring Rolls', 'Crispy vegetable spring rolls with sweet chili dipping sauce', 5.99, 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600', 'starters', false, true),
  ('Meat Pie', 'Flaky pastry filled with seasoned minced meat and vegetables', 4.99, 'https://images.unsplash.com/photo-1432139509613-5c4255a1d197?w=600', 'starters', false, true),
  ('Sobolo', 'Chilled hibiscus drink infused with ginger and spices', 3.99, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600', 'drinks', true, true),
  ('Fresh Coconut Water', 'Pure coconut water served chilled', 2.99, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600', 'drinks', false, true),
  ('Chapman', 'Nigerian-inspired fruity cocktail with a fizzy twist', 4.99, 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=600', 'drinks', false, true),
  ('Bofrot', 'Sweet puff-puff doughnuts, golden-fried and dusted with sugar', 4.99, 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600', 'desserts', true, true),
  ('Ice Cream Sundae', 'Vanilla ice cream with chocolate drizzle, nuts, and whipped cream', 6.99, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600', 'desserts', false, true);
