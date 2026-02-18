import { supabase } from '@/integrations/supabase/client';
import type { MenuItem, MenuCategory } from '@/types';

export async function getMenuItems(): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }
  return (data ?? []).map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    image: row.image,
    category: row.category as MenuCategory,
    popular: row.popular ?? false,
    available: row.available ?? true,
  }));
}

export async function addMenuItem(item: Omit<MenuItem, 'id'>): Promise<void> {
  const { error } = await supabase.from('menu_items').insert({
    name: item.name,
    description: item.description,
    price: item.price,
    image: item.image,
    category: item.category,
    popular: item.popular ?? false,
    available: item.available ?? true,
  });
  if (error) throw error;
}

export async function updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<void> {
  const { id: _, ...rest } = updates as any;
  const { error } = await supabase.from('menu_items').update(rest).eq('id', id);
  if (error) throw error;
}

export async function deleteMenuItem(id: string): Promise<void> {
  const { error } = await supabase.from('menu_items').delete().eq('id', id);
  if (error) throw error;
}
