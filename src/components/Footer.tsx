import { Flame } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container flex flex-col items-center gap-4 py-8 md:flex-row md:justify-between">
        <div className="flex items-center gap-2 font-display text-lg font-bold text-primary">
          <Flame className="h-5 w-5" />
          Frankies Fast Food
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Frankies Fast Food. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
