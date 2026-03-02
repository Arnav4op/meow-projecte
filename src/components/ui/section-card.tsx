import { ReactNode } from 'react';
import { Plane } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

interface SectionCardProps {
  title?: string;
  icon?: ReactNode;
  badge?: number;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, icon, badge, children, className }: SectionCardProps) {
  const { theme } = useTheme();
  
  return (
    <div className={cn(
      "rounded-xl overflow-hidden",
      className
    )} style={{
      background: theme === 'dark'
        ? 'linear-gradient(135deg, hsl(215, 30%, 12%) 0%, hsl(215, 28%, 10%) 100%)'
        : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      border: `1px solid ${theme === 'dark' ? 'hsl(215, 25%, 18%)' : 'e2e8f0'}`,
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.02)'
    }}>
      {title && (
        <div 
          className="flex items-center gap-2 px-4 py-3 border-b" 
          style={{
            borderColor: theme === 'dark' ? 'rgba(100, 150, 200, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            background: theme === 'dark'
              ? 'linear-gradient(90deg, hsl(185, 80%, 55% / 0.08) 0%, transparent 100%)'
              : 'linear-gradient(90deg, rgba(14, 165, 233, 0.08) 0%, transparent 100%)'
          }}
        >
          {icon || <Plane className="h-5 w-5" style={{ color: theme === 'dark' ? 'hsl(185, 80%, 55%)' : '#0284c7' }} />}
          <h2 
            className="text-base font-semibold" 
            style={{ color: theme === 'dark' ? 'hsl(210, 18%, 85%)' : '#1e293b' }}
          >
            {title}
          </h2>
          {badge !== undefined && badge > 0 && (
            <span 
              className="ml-auto px-2 py-0.5 text-xs font-medium rounded-md" 
              style={{
                background: theme === 'dark' ? 'hsl(185, 80%, 55% / 0.15)' : 'rgba(14, 165, 233, 0.15)',
                color: theme === 'dark' ? 'hsl(185, 80%, 55%)' : '#0284c7',
                border: theme === 'dark' ? '1px solid hsl(185, 80%, 55% / 0.25)' : '1px solid rgba(14, 165, 233, 0.25)'
              }}
            >
              {badge}
            </span>
          )}
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
