import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Truck, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MenuItemCard } from '@/components/MenuItemCard';
import { menuItems } from '@/data/menu';

const popularItems = menuItems.filter(i => i.popular).slice(0, 4);

const features = [
  { icon: Clock, title: 'Fast Delivery', desc: '30 minutes or less' },
  { icon: Star, title: 'Fresh & Quality', desc: 'Made with premium ingredients' },
  { icon: Truck, title: 'Free Delivery', desc: 'On orders above $30' },
];

const Index = () => {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-cream">
        <div className="container flex flex-col items-center gap-8 py-20 text-center md:py-32">
          <h1 className="max-w-3xl animate-fade-in font-display text-4xl font-extrabold leading-tight md:text-6xl">
            Bold Flavors,{' '}
            <span className="text-primary">Delivered Hot</span>{' '}
            to Your Door
          </h1>
          <p className="max-w-xl animate-fade-in text-lg text-muted-foreground" style={{ animationDelay: '0.15s' }}>
            Explore our chef-crafted menu and enjoy restaurant-quality meals from the comfort of home. No account needed — just order and eat!
          </p>
          <div className="flex animate-fade-in gap-3" style={{ animationDelay: '0.3s' }}>
            <Link to="/menu">
              <Button size="lg" className="gap-2 text-base">
                Order Now <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/menu">
              <Button size="lg" variant="outline" className="text-base">
                Browse Menu
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b bg-card">
        <div className="container grid gap-6 py-12 md:grid-cols-3">
          {features.map(f => (
            <div key={f.title} className="flex items-center gap-4 rounded-xl p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <f.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular */}
      <section className="container py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Most Loved</p>
            <h2 className="font-display text-3xl font-bold">Popular Dishes</h2>
          </div>
          <Link to="/menu" className="hidden text-sm font-medium text-primary hover:underline md:block">
            View full menu →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {popularItems.map(item => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
        <div className="mt-6 text-center md:hidden">
          <Link to="/menu">
            <Button variant="outline" className="gap-2">
              View Full Menu <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="container flex flex-col items-center gap-4 py-16 text-center">
          <h2 className="font-display text-3xl font-bold">Hungry? Order in minutes.</h2>
          <p className="max-w-md opacity-90">No sign-up required. Pick your favorites, checkout as a guest, and we'll handle the rest.</p>
          <Link to="/menu">
            <Button size="lg" variant="secondary" className="mt-2 gap-2">
              Start Your Order <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
};

export default Index;
