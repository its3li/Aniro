'use client';

import { useState, useEffect } from 'react';
import { CategoryGrid } from '@/components/azkar/category-grid';
import { azkarData, type AzkarCategory, type AzkarItem } from '@/lib/azkar';
import { ZikrCard } from '@/components/azkar/zikr-card'; // Changed export name to match file
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useSettings } from '@/components/providers/settings-provider';

function findCategoryPath(root: AzkarCategory, categoryId: string): AzkarCategory[] | null {
  if (root.id === categoryId) return [root];

  for (const child of root.subCategories ?? []) {
    const childPath = findCategoryPath(child, categoryId);
    if (childPath) return [root, ...childPath];
  }

  return null;
}

export default function AzkarPage() {
  const [navigationStack, setNavigationStack] = useState<AzkarCategory[]>([azkarData]);
  const { settings } = useSettings();
  const isArabic = settings.language === 'ar';

  const currentLevel = navigationStack[navigationStack.length - 1];
  const parentLevel = navigationStack.length > 1 ? navigationStack[navigationStack.length - 2] : null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [navigationStack]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categoryId = params.get('category');
    if (!categoryId) return;

    const categoryPath = findCategoryPath(azkarData, categoryId);
    if (categoryPath) {
      const timeoutId = window.setTimeout(() => setNavigationStack(categoryPath), 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, []);

  const handleSelect = (item: AzkarCategory | AzkarItem) => {
    if ('subCategories' in item || 'items' in item) {
      setNavigationStack(prev => [...prev, item as AzkarCategory]);
    }
  };

  const handleBack = () => {
    if (navigationStack.length > 1) {
      setNavigationStack(prev => prev.slice(0, -1));
    }
  };

  const hasSubcategories = currentLevel.subCategories && currentLevel.subCategories.length > 0;
  const hasItems = currentLevel.items && currentLevel.items.length > 0;

  const currentName = isArabic ? (currentLevel.id === 'root' ? 'الأذكار' : currentLevel.nameAr) : currentLevel.name;
  const parentName = parentLevel ? (isArabic ? parentLevel.nameAr : parentLevel.name) : '';

  return (
    <div className="px-4 pt-4 pb-20 animate-fade-in min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        {navigationStack.length > 1 && (
          <Button variant="ghost" size="icon" onClick={handleBack} className="bg-card border border-border h-10 w-10 rounded-xl shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{currentName}</h1>
          {parentLevel && <p className="text-sm text-muted-foreground">{parentName}</p>}
        </div>
      </div>

      {hasSubcategories && (
        <CategoryGrid categories={currentLevel.subCategories!} onSelect={handleSelect} />
      )}

      {hasItems && (
        <div className="space-y-4">
          {currentLevel.items!.map((item, index) => (
            <ZikrCard key={index} item={item} categoryId={currentLevel.id} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
