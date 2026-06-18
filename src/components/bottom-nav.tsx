'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpenText, Compass, HandHeart, House, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettings } from './providers/settings-provider';
import { TasbeehIcon } from './icons/tasbeeh-icon';

const navItems = [
  { href: '/', label: 'Home', labelAr: 'الرئيسية', icon: House },
  { href: '/quran', label: 'Quran', labelAr: 'القرآن', icon: BookOpenText },
  { href: '/azkar', label: 'Azkar', labelAr: 'الأذكار', icon: HandHeart },
  { href: '/tasbeeh', label: 'Tasbeeh', labelAr: 'السبحة', icon: TasbeehIcon },
  { href: '/qibla', label: 'Qibla', labelAr: 'القبلة', icon: Compass },
  { href: '/settings', label: 'Settings', labelAr: 'الإعدادات', icon: SlidersHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();
  const { settings } = useSettings();
  const isArabic = settings.language === 'ar';

  return (
    <div
      style={{ fontSize: `${settings.fontSize}px` }}
      className="flex w-full items-end justify-around border-t border-border bg-card safe-area-bottom pb-1"
    >
      {navItems.map((item) => {
        const isActive = (item.href === '/' && pathname === '/') || (item.href !== '/' && pathname.startsWith(item.href));
        const label = isArabic ? item.labelAr : item.label;
        return (
          <Link href={item.href} key={item.label} className="flex-1">
            <div
              className={cn(
                'relative flex w-full flex-col items-center justify-center gap-1 px-1 py-2.5 transition-all duration-200 active:scale-95',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {isActive && <span className="absolute top-0 h-0.5 w-8 rounded-b-full bg-primary" />}
              <item.icon className={cn("mb-0.5 h-5 w-5", isActive && "stroke-[2.35px]")} strokeWidth={1.8} />
              <span className={cn(
                "max-w-full truncate text-[9.5px] font-semibold tracking-normal",
                isActive ? "text-primary" : "text-muted-foreground/80"
              )}>{label}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
