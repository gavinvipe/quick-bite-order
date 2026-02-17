import type { MenuItem } from '@/types';
import { menuItems as defaultMenuItems } from '@/data/menu';

const MENU_KEY = 'flamekitchen_menu';

export function getMenuItems(): MenuItem[] {
  try {
    const raw = localStorage.getItem(MENU_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [...defaultMenuItems];
}

export function saveMenuItems(items: MenuItem[]) {
  localStorage.setItem(MENU_KEY, JSON.stringify(items));
}

export function addMenuItem(item: MenuItem) {
  const items = getMenuItems();
  items.push(item);
  saveMenuItems(items);
  return items;
}

export function updateMenuItem(id: string, updates: Partial<MenuItem>) {
  const items = getMenuItems();
  const idx = items.findIndex(i => i.id === id);
  if (idx !== -1) items[idx] = { ...items[idx], ...updates };
  saveMenuItems(items);
  return items;
}

export function deleteMenuItem(id: string) {
  const items = getMenuItems().filter(i => i.id !== id);
  saveMenuItems(items);
  return items;
}

export function generateMenuItemId(): string {
  return 'mi-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
}
