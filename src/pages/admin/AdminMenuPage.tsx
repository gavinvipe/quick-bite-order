import { useState, useEffect } from 'react';
import { getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem } from '@/lib/menu-store';
import { categories } from '@/data/menu';
import type { MenuItem, MenuCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, UtensilsCrossed, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const emptyForm = {
  name: '',
  description: '',
  price: 0,
  image: '',
  category: 'mains' as MenuCategory,
  popular: false,
  available: true,
};

const AdminMenuPage = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterCat, setFilterCat] = useState<MenuCategory | 'all'>('all');

  const refresh = async () => setItems(await getMenuItems());
  useEffect(() => { refresh(); }, []);

  const openAdd = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setForm({ name: item.name, description: item.description, price: item.price, image: item.image, category: item.category, popular: item.popular ?? false, available: item.available ?? true });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || form.price <= 0) {
      toast.error('Name and a valid price are required.');
      return;
    }
    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, form);
      } else {
        await addMenuItem(form);
      }
      await refresh();
      setDialogOpen(false);
      toast.success(editingItem ? 'Item updated' : 'Item added');
    } catch {
      toast.error('Failed to save item');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMenuItem(id);
      await refresh();
      toast.success('Item deleted');
    } catch {
      toast.error('Failed to delete item');
    }
  };

  const filtered = filterCat === 'all' ? items : items.filter(i => i.category === filterCat);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Menu Items</h1>
          <p className="text-sm text-muted-foreground">{items.length} items</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterCat} onValueChange={v => setFilterCat(v as MenuCategory | 'all')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.emoji} {c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openAdd} className="gap-1">
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <UtensilsCrossed className="h-12 w-12 text-muted-foreground/40" />
          <p className="font-medium">No menu items</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(item => (
            <Card key={item.id} className={cn('animate-fade-in', !item.available && 'opacity-60')}>
              <CardContent className="flex gap-4 p-4">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="h-20 w-20 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold leading-tight">{item.name}</h3>
                      {item.popular && <Badge variant="secondary" className="text-[10px]">Popular</Badge>}
                    </div>
                    <p className="text-sm font-medium text-primary">${item.price.toFixed(2)}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {categories.find(c => c.id === item.category)?.label}
                    </Badge>
                    {!item.available && <Badge variant="destructive" className="text-[10px]">Unavailable</Badge>}
                    <div className="ml-auto flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Dish name" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price ($) *</Label>
                <Input type="number" step="0.01" min="0" value={form.price || ''} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as MenuCategory }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.emoji} {c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.available} onCheckedChange={v => setForm(f => ({ ...f, available: v }))} />
                Available
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.popular} onCheckedChange={v => setForm(f => ({ ...f, popular: v }))} />
                Popular
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingItem ? 'Update' : 'Add Item'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMenuPage;
