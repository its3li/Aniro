'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpenIcon as BookOpen } from '@/components/icons/interface-icons';
import { CompassIcon as Compass } from '@/components/icons/interface-icons';
import { HandsPrayingIcon as HandHeart } from '@/components/icons/interface-icons';
import { HouseLineIcon as House } from '@/components/icons/interface-icons';
import { SlidersHorizontalIcon as Settings2 } from '@/components/icons/interface-icons';
import { cn } from '@/lib/utils';
import { useSettings } from './providers/settings-provider';
import { TasbeehIcon } from './icons/tasbeeh-icon';

const navItems = [
  { href: '/', label: 'Home', labelAr: 'الرئيسية', icon: House },
  { href: '/quran', label: 'Quran', labelAr: 'القرآن', icon: BookOpen },
  { href: '/azkar', label: 'Azkar', labelAr: 'الأذكار', icon: HandHeart },
  { href: '/tasbeeh', label: 'Tasbeeh', labelAr: 'السبحة', icon: TasbeehIcon },
  { href: '/qibla', label: 'Qibla', labelAr: 'القبلة', icon: Compass },
  { href: '/settings', label: 'Settings', labelAr: 'الإعدادات', icon: Settings2 },
];

export function BottomNav() {
  const pathname = usePathname();
  const { settings } = useSettings();
  const isArabic = settings.language === 'ar';

  return (
    <nav aria-label={isArabic ? 'التنقل الرئيسي' : 'Main navigation'}
      style={{ fontSize: `${settings.fontSize}px` }}
      className="bottom-navigation"
    >
      {navItems.map((item) => {
        const isActive = (item.href === '/' && pathname === '/') || (item.href !== '/' && pathname.startsWith(item.href));
        const label = isArabic ? item.labelAr : item.label;
        return (
          <Link href={item.href} key={item.label} className={cn('navigation-item', isActive && 'is-active')} aria-current={isActive ? 'page' : undefined}>
            <div
              className={cn(
                'relative flex w-full flex-col items-center justify-center gap-1 px-1 py-2.5 transition-all duration-200 active:scale-95',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="mb-0.5 h-[22px] w-[22px]" weight={isActive ? 'duotone' : 'regular'} />
              <span className={cn(
                "max-w-full text-[11px] font-medium tracking-normal",
                isActive ? "text-primary" : "text-muted-foreground/80"
              )}>{label}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
