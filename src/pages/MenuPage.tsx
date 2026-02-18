import { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MenuItemCard } from '@/components/MenuItemCard';
import { getMenuItems } from '@/lib/menu-store';
import { categories } from '@/data/menu';
import { cn } from '@/lib/utils';
import type { MenuItem, MenuCategory } from '@/types';

const MenuPage = () => {
  const [activeCategory, setActiveCategory] = useState<MenuCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [allItems, setAllItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    getMenuItems().then(setAllItems);
  }, []);

  const filtered = useMemo(() => {
    let items = allItems.filter(i => i.available);
    if (activeCategory !== 'all') {
      items = items.filter(i => i.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        i => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
      );
    }
    return items;
  }, [activeCategory, search, allItems]);

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Our Menu</h1>
        <p className="mt-1 text-muted-foreground">Explore our full selection of dishes</p>
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search dishes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory('all')}
          >
            All
          </Button>
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat.id)}
              className="gap-1"
            >
              {cat.emoji} {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(item => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <p className="text-lg font-medium">No dishes found</p>
          <p className="text-sm text-muted-foreground">Try a different search or category</p>
        </div>
      )}
    </div>
  );
};

export default MenuPage;
