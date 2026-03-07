'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Compass, Settings as SettingsIcon } from 'lucide-react';
import HandsPraying from './icons/hands-praying'; // Custom icon
import { cn } from '@/lib/utils';
import { useSettings } from './providers/settings-provider';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/', label: 'Home', labelAr: 'الرئيسية', icon: Home },
  { href: '/quran', label: 'Quran', labelAr: 'القرآن', icon: BookOpen },
  { href: '/azkar', label: 'Azkar', labelAr: 'الأذكار', icon: HandsPraying },
  { href: '/qibla', label: 'Qibla', labelAr: 'القبلة', icon: Compass },
  { href: '/settings', label: 'Settings', labelAr: 'الإعدادات', icon: SettingsIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  const { settings } = useSettings();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isArabic = settings.language === 'ar';

  return (
    <div
      style={isClient ? { fontSize: `${settings.fontSize}px` } : {}}
      className="bg-card border-t border-border/60 flex justify-around items-end w-full safe-area-bottom pb-1"
    >
      {navItems.map((item) => {
        const isActive = (item.href === '/' && pathname === '/') || (item.href !== '/' && pathname.startsWith(item.href));
        const label = isArabic ? item.labelAr : item.label;
        return (
          <Link href={item.href} key={item.label} className="flex-1 flex justify-center">
            <div
              className={cn(
                'flex flex-col items-center justify-center gap-1 py-3 px-1 transition-all duration-200 w-full active:scale-95',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className={cn("w-6 h-6 mb-0.5", isActive && "stroke-[2.5px]")} strokeWidth={1.75} />
              <span className={cn(
                "text-[10px] font-medium tracking-tight",
                isActive ? "text-primary" : "text-muted-foreground/80"
              )}>{label}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
