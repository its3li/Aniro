'use client';
import { GlassCard } from '@/components/glass-card';
import { cn } from '@/lib/utils';
import { useSettings } from '../providers/settings-provider';
import { AzkarCategory } from "@/lib/azkar";
import { Sun, MoonStar, BedDouble, ShieldCheck, SunMoon, Home, BookOpenText, Library, Star, SunDim, Flower2, Droplets } from 'lucide-react';

function HandsPrayingIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m18 11-5.5-5.5a2.12 2.12 0 0 0-3 0L4 11" />
      <path d="M12 21v-4" />
      <path d="M4 11v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M12 9v4" />
      <path d="M9 13l-3-3" />
      <path d="M15 13l3-3" />
    </svg>
  )
}

function CustomHeartIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 6.00019C10.2006 3.90317 7.19377 3.2551 4.93923 5.17534C2.68468 7.09558 2.36727 10.3061 4.13778 12.5772C5.60984 14.4654 10.0648 18.4479 11.5249 19.7369C11.6882 19.8811 11.7699 19.9532 11.8652 19.9815C11.9483 20.0062 12.0393 20.0062 12.1225 19.9815C12.2178 19.9532 12.2994 19.8811 12.4628 19.7369C13.9229 18.4479 18.3778 14.4654 19.8499 12.5772C21.6204 10.3061 21.3417 7.07538 19.0484 5.17534C16.7551 3.2753 13.7994 3.90317 12 6.00019Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CustomPrayIcon(props: any) {
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g>
        <polyline points="34 43 52 43 58 61 6 61 12 43 20.771 43" style={{ fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2px" }} />
        <circle cx="13" cy="27" r="1.5" style={{ fill: "currentColor" }} />
        <line x1="52" y1="7" x2="52" y2="10" style={{ fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2px" }} />
        <line x1="52" y1="14" x2="52" y2="17" style={{ fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2px" }} />
        <line x1="50" y1="12" x2="47" y2="12" style={{ fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2px" }} />
        <line x1="57" y1="12" x2="54" y2="12" style={{ fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2px" }} />
        <circle cx="43" cy="4" r="1.5" style={{ fill: "currentColor" }} />
        <line x1="31.157" y1="24.206" x2="30" y2="19" style={{ fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2px" }} />
        <path d="M21.585,10a5.359,5.359,0,0,0,.154,1.556L22.893,16.2a4.093,4.093,0,0,0,1.7,2.435h0L21.273,40.311,21,43.994a5.594,5.594,0,0,0,5.23,5.582L33,50,15,53l-3.029,3H38.515A6.485,6.485,0,0,0,45,49.315a6.666,6.666,0,0,0-6.754-6.286H33.471l.4-4.587a9.375,9.375,0,0,0-.016-1.812" style={{ fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2px" }} />
        <path d="M28.59,18.911l4.823-1.234-1.838-8.45a4.988,4.988,0,0,0-.461-1.184" style={{ fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2px" }} />
        <path d="M21.9,4.094h7.23A2.071,2.071,0,0,1,31.2,6.166V9.094a0,0,0,0,1,0,0H19.833a0,0,0,0,1,0,0V6.166A2.071,2.071,0,0,1,21.9,4.094Z" transform="translate(-0.792 5.037) rotate(-11.102)" style={{ fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2px" }} />
        <line x1="45.268" y1="32.841" x2="43.559" y2="29.463" style={{ fill: "none", stroke: "currentColor", strokeLinejoin: "round", strokeWidth: "2px" }} />
        <path d="M49.743,27.835a1.411,1.411,0,0,0-1.738-.448l-4.446,2.076-6.5,3.035-5.707-7.836c-1.039-1.426-2.786-1.923-3.9-1.11h0c-1.116.813-1.179,2.628-.14,4.054l6.09,8.361c1.451,1.992,3.891,2.686,5.45,1.551l6.421-4.677,4.165-3.034A1.413,1.413,0,0,0,49.743,27.835Z" style={{ fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2px" }} />
        <line x1="38" y1="50" x2="36" y2="50" style={{ fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2px" }} />
        <line x1="60" y1="52" x2="55" y2="52" style={{ fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2px" }} />
        <line x1="63" y1="61" x2="58" y2="61" style={{ fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2px" }} />
        <line x1="56" y1="43" x2="52" y2="43" style={{ fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2px" }} />
        <line x1="4" y1="52" x2="9" y2="52" style={{ fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2px" }} />
        <line x1="1" y1="61" x2="6" y2="61" style={{ fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2px" }} />
        <line x1="8" y1="43" x2="12" y2="43" style={{ fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2px" }} />
      </g>
    </svg>
  );
}

function CustomSadIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2.75C6.89137 2.75 2.75 6.89137 2.75 12C2.75 17.1086 6.89137 21.25 12 21.25C17.1086 21.25 21.25 17.1086 21.25 12C21.25 6.89137 17.1086 2.75 12 2.75ZM1.25 12C1.25 6.06294 6.06294 1.25 12 1.25C17.9371 1.25 22.75 6.06294 22.75 12C22.75 17.9371 17.9371 22.75 12 22.75C6.06294 22.75 1.25 17.9371 1.25 12ZM8.55339 16.3975C9.5258 15.6767 10.715 15.25 12 15.25C13.285 15.25 14.4742 15.6767 15.4466 16.3975C15.7794 16.6441 15.8492 17.1138 15.6025 17.4466C15.3559 17.7794 14.8862 17.8492 14.5534 17.6025C13.825 17.0627 12.9459 16.75 12 16.75C11.0541 16.75 10.175 17.0627 9.44661 17.6025C9.11385 17.8492 8.64413 17.7794 8.39747 17.4466C8.15082 17.1138 8.22062 16.6441 8.55339 16.3975Z" fill="currentColor" />
      <path d="M16 10.5C16 11.3284 15.5523 12 15 12C14.4477 12 14 11.3284 14 10.5C14 9.67157 14.4477 9 15 9C15.5523 9 16 9.67157 16 10.5Z" fill="currentColor" />
      <path d="M10 10.5C10 11.3284 9.55229 12 9 12C8.44772 12 8 11.3284 8 10.5C8 9.67157 8.44772 9 9 9C9.55229 9 10 9.67157 10 10.5Z" fill="currentColor" />
    </svg>
  );
}

// Enhanced category styling with solid cohesive colors instead of gradients
const categoryStyles: Record<string, { bg: string, text: string, iconColor: string }> = {
  'morning-azkar': { bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-900 dark:text-orange-100', iconColor: 'text-orange-600 dark:text-orange-400' },
  'evening-azkar': { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-900 dark:text-blue-100', iconColor: 'text-blue-600 dark:text-blue-400' },
  'after-prayer-azkar': { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-900 dark:text-emerald-100', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  'sleep-dreams': { bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-900 dark:text-indigo-100', iconColor: 'text-indigo-600 dark:text-indigo-400' },
  'special-prayers': { bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-900 dark:text-rose-100', iconColor: 'text-rose-600 dark:text-rose-400' },
  'hardship-relief': { bg: 'bg-slate-50 dark:bg-slate-900/40', text: 'text-slate-900 dark:text-slate-100', iconColor: 'text-slate-600 dark:text-slate-400' },
  'daily-duas': { bg: 'bg-teal-50 dark:bg-teal-950/30', text: 'text-teal-900 dark:text-teal-100', iconColor: 'text-teal-600 dark:text-teal-400' },
  'quranic-duas': { bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-900 dark:text-violet-100', iconColor: 'text-violet-600 dark:text-violet-400' },
};

const iconMap: Record<string, any> = {
  'Library': Library,
  'Sun': Sun,
  'SunDim': SunDim,
  'MoonStar': MoonStar,
  'BedDouble': BedDouble,
  'ShieldCheck': ShieldCheck, // Hardship 
  'SunMoon': SunMoon,
  'Home': Home,
  'BookOpenText': BookOpenText,
  // More fitting ones
  'Flower2': Flower2, // Prophetic Duas
  'Droplets': Droplets, // Hardship
  'PalmsUp': HandsPrayingIcon, // After prayer / General Dua
  // Custom user icons:
  'CustomPray': CustomPrayIcon,
  'CustomHeart': CustomHeartIcon,
  'CustomSad': CustomSadIcon, // Hardship
};

interface CategoryGridProps {
  categories: AzkarCategory[];
  onSelect: (item: any) => void;
}

export function CategoryGrid({ categories, onSelect }: CategoryGridProps) {
  const { settings } = useSettings();
  const isArabic = settings.language === 'ar';

  return (
    <div className="grid grid-cols-2 gap-3 pb-8">
      {categories.map((category) => {
        const style = categoryStyles[category.id] || { bg: 'bg-muted/50', text: 'text-foreground', iconColor: 'text-primary' };
        const Icon = iconMap[category.icon] || Star;
        const name = isArabic ? category.nameAr : category.name;

        return (
          <div
            key={category.id}
            onClick={() => onSelect(category)}
            className={cn(
              "group relative flex flex-col items-center justify-center p-5 rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.97]",
              "bg-card border border-border/50 hover:border-primary/20",
            )}
          >
            {/* Icon Container with specific cohesive background */}
            <div className={cn("w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors", style.bg)}>
              <Icon className={cn("w-7 h-7", style.iconColor)} strokeWidth={1.5} />
            </div>

            <h3 className="font-semibold text-center text-sm leading-tight text-foreground/90 group-hover:text-primary transition-colors">
              {name}
            </h3>
          </div>
        );
      })}
    </div>
  );
}
