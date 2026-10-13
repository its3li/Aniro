'use client';
import { cn } from '@/lib/utils';
import { useSettings } from '../providers/settings-provider';
import { AzkarCategory } from "@/lib/azkar";
import { BedIcon as BedDouble } from '@/components/icons/interface-icons';
import { BookOpenTextIcon as BookOpenText } from '@/components/icons/interface-icons';
import { CarProfileIcon as Car } from '@/components/icons/interface-icons';
import { CloudRainIcon as CloudRain } from '@/components/icons/interface-icons';
import { DoorOpenIcon as DoorOpen } from '@/components/icons/interface-icons';
import { HandsPrayingIcon as HandHeart } from '@/components/icons/interface-icons';
import { HandHeartIcon as HeartHandshake } from '@/components/icons/interface-icons';
import { HouseLineIcon as Home } from '@/components/icons/interface-icons';
import { BooksIcon as Library } from '@/components/icons/interface-icons';
import { MoonStarsIcon as MoonStar } from '@/components/icons/interface-icons';
import { ShieldCheckIcon as ShieldCheck } from '@/components/icons/interface-icons';
import { TShirtIcon as Shirt } from '@/components/icons/interface-icons';
import { StarIcon as Star } from '@/components/icons/interface-icons';
import { SunIcon as Sun } from '@/components/icons/interface-icons';
import { SunDimIcon as SunDim } from '@/components/icons/interface-icons';
import { SunHorizonIcon as SunMoon } from '@/components/icons/interface-icons';
import { ForkKnifeIcon as Utensils } from '@/components/icons/interface-icons';

const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  'Library': Library,
  'Sun': Sun,
  'SunDim': SunDim,
  'MoonStar': MoonStar,
  'BedDouble': BedDouble,
  'ShieldCheck': ShieldCheck,
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
    <div className="azkar-categories">
      {categories.map((category) => {
        const Icon = iconMap[category.icon] || Star;
        const name = isArabic ? category.nameAr : category.name;

        return (
          <button type="button"
            key={category.id}
            onClick={() => onSelect(category)}
            className={cn(
              "azkar-category group",
            )}
          >
            <div className="category-symbol">
              <Icon className="h-7 w-7" strokeWidth={1.5} />
            </div>

            <h3 className="font-semibold text-start text-base leading-relaxed text-foreground/90 group-hover:text-primary transition-colors">
              {name}
            </h3>
          </button>
        );
      })}
    </div>
  );
}
