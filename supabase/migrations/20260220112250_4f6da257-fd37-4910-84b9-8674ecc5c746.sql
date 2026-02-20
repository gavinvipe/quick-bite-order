
-- Add user_id to orders for account-based tracking (nullable for guest orders)
ALTER TABLE public.orders ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for user order lookups
CREATE INDEX idx_orders_user_id ON public.orders(user_id);

-- Create index for phone-based guest recovery
CREATE INDEX idx_orders_customer_phone ON public.orders(customer_phone);

-- Policy: logged-in users can see their own orders
CREATE POLICY "Users can view their own orders"
ON public.orders FOR SELECT
USING (auth.uid() = user_id);

-- Update existing "Anyone can read order by ID" to be more specific
-- Keep existing policy for direct ID lookups (track page)
