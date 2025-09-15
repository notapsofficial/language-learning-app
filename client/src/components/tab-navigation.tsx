import { Home, Book, Mic, TrendingUp, Settings } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';

const tabs = [
  {
    id: 'dashboard',
    path: '/',
    icon: Home,
    label: 'ダッシュボード',
    labelShort: 'ホーム',
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'vocabulary',
    path: '/vocabulary',
    icon: Book,
    label: '単語学習',
    labelShort: '単語',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    id: 'pronunciation',
    path: '/pronunciation',
    icon: Mic,
    label: '発音練習',
    labelShort: '発音',
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 'progress',
    path: '/progress',
    icon: TrendingUp,
    label: '進捗',
    labelShort: '進捗',
    color: 'from-purple-500 to-purple-600',
  },
  {
    id: 'settings',
    path: '/settings',
    icon: Settings,
    label: '設定',
    labelShort: '設定',
    color: 'from-gray-500 to-gray-600',
  },
];

export function TabNavigation() {
  const [location] = useLocation();

  return (
    <div className="premium-tab-bar fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-mobile mx-auto">
        <div className="flex justify-around px-4">
          {tabs.map(({ id, path, icon: Icon, label, labelShort, color }) => {
            const isActive = location === path;
            
            return (
              <Link
                key={id}
                href={path}
                className={cn(
                  "premium-tab-button relative",
                  isActive ? "active" : ""
                )}
                data-testid={`tab-${id}`}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className={cn(
                    "absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r",
                    color.replace('from-', 'from-').replace('to-', 'to-')
                  )} />
                )}
                
                {/* Icon container */}
                <div className={cn(
                  "relative p-2 rounded-2xl transition-all duration-300",
                  isActive ? cn("bg-gradient-to-br shadow-lg", color, "text-white scale-110") : "text-muted-foreground"
                )}>
                  <Icon className={cn(
                    "h-6 w-6 transition-all duration-300",
                    isActive ? "scale-110" : "scale-100"
                  )} />
                  
                  {/* Glow effect for active tab */}
                  {isActive && (
                    <div className={cn(
                      "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-30 blur-sm -z-10",
                      color
                    )} />
                  )}
                </div>
                
                {/* Label */}
                <span className={cn(
                  "text-caption font-medium transition-all duration-300 mt-1",
                  isActive ? "text-foreground scale-105" : "text-muted-foreground opacity-75"
                )}>
                  {labelShort}
                </span>

                {/* Background highlight */}
                <div className={cn(
                  "absolute inset-0 rounded-2xl transition-all duration-300",
                  isActive ? "bg-primary/5 scale-105" : "bg-transparent"
                )} />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}