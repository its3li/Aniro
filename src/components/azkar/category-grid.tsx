'use client';
import { cn } from '@/lib/utils';
import { useSettings } from '../providers/settings-provider';
import { AzkarCategory } from "@/lib/azkar";
import { BedDouble, BookOpenText, Car, CloudRain, DoorOpen, HandHeart, HeartHandshake, Home, Library, MoonStar, ShieldCheck, Shirt, Star, Sun, SunDim, SunMoon, Utensils } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  'Library': Library,
  'Sun': Sun,
  'SunDim': SunDim,
  'MoonStar': MoonStar,
  'BedDouble': BedDouble,
  'ShieldCheck': ShieldCheck, // Hardship 
  'SunMoon': SunMoon,
  'Home': Home,
  'BookOpenText': BookOpenText,
  'Flower2': HeartHandshake,
  'Droplets': CloudRain,
  'PalmsUp': HandHeart,
  'Utensils': Utensils,
  'Car': Car,
  'Shirt': Shirt,
  'DoorOpen': DoorOpen,
  'CustomPray': HandHeart,
  'CustomHeart': HeartHandshake,
  'CustomSad': CloudRain,
};

interface CategoryGridProps {
  categories: AzkarCategory[];
  onSelect: (item: AzkarCategory) => void;
}

export function CategoryGrid({ categories, onSelect }: CategoryGridProps) {
  const { settings } = useSettings();
  const isArabic = settings.language === 'ar';

  return (
    <div className="grid grid-cols-2 gap-3 pb-8">
      {categories.map((category) => {
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
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors">
              <Icon className="h-7 w-7" strokeWidth={1.5} />
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
