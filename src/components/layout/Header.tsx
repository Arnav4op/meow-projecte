import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';
import { useTheme } from '@/hooks/useTheme';

export function Header() {
  const { theme } = useTheme();
  
  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="fixed top-3 left-3 z-50"
            style={{
              background: theme === 'dark' ? 'rgba(13, 31, 51, 0.9)' : 'rgba(248, 250, 252, 0.9)',
              color: theme === 'dark' ? 'hsl(210, 18%, 85%)' : '#1e293b'
            }}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72" style={{
          background: theme === 'dark' ? '#0d1f33' : '#f8fafc'
        }}>
          <Sidebar />
        </SheetContent>
      </Sheet>
    </div>
  );
}
