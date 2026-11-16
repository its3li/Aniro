'use client';

import { useState, useEffect, useRef } from 'react';
import { CategoryGrid } from '@/components/azkar/category-grid';
import { azkarData, type AzkarCategory, type AzkarItem } from '@/lib/azkar';
import { ZikrCard } from '@/components/azkar/zikr-card';
import { useLocalDay } from '@/hooks/use-local-day';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon as ArrowLeft } from '@/components/icons/interface-icons';
import { useSettings } from '@/components/providers/settings-provider';
import { PageHeading } from '@/components/page-heading';
import { useShareImage } from '@/components/share/share-image-dialog';
import { useDragSelect } from '@/hooks/use-drag-select';
import { SelectionActionBar } from '@/components/share/selection-action-bar';
import { toast } from '@/hooks/use-toast';
import { ShareNetworkIcon as ShareNetwork } from '@/components/icons/interface-icons';
import { azkarShareText } from '@/lib/azkar-share';
import { PlusIcon as Plus } from '@/components/icons/interface-icons';
import { PencilSimpleIcon as PencilSimple } from '@/components/icons/interface-icons';
import { useCustomAzkar } from '@/components/azkar/custom-azkar-sheets';
import { CUSTOM_SET_PREFIX, customSetToCategory, useCustomAzkarSets } from '@/lib/custom-azkar';

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
  const { openShareImage } = useShareImage();
  const listRef = useRef<HTMLDivElement>(null);
  const drag = useDragSelect(listRef);
  const { clear: clearDrag } = drag;
  const day = useLocalDay();

  const { sets: customSets, loaded: setsLoaded } = useCustomAzkarSets();
  const { openNewSet, openEditSet, openAddToAzkar } = useCustomAzkar();
  const stackTop = navigationStack[navigationStack.length - 1];
  const customSetId = stackTop.id.startsWith(CUSTOM_SET_PREFIX) ? stackTop.id.slice(CUSTOM_SET_PREFIX.length) : null;
  const customSet = customSetId ? customSets.find(set => set.id === customSetId) : undefined;
  // Custom sets are read live so edits show immediately.
  const currentLevel = customSet ? customSetToCategory(customSet) : stackTop;
  const parentLevel = navigationStack.length > 1 ? navigationStack[navigationStack.length - 2] : null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [navigationStack]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categoryId = params.get('category');
    if (!categoryId) return;

    // Custom sets (e.g. opened from a reminder) need the stored sets first.
    if (categoryId.startsWith(CUSTOM_SET_PREFIX)) {
      if (!setsLoaded) return;
      const set = customSets.find(s => CUSTOM_SET_PREFIX + s.id === categoryId);
      if (!set) return;
      const timeoutId = window.setTimeout(() => {
        setNavigationStack([azkarData, customSetToCategory(set)]);
        window.history.replaceState(null, '', window.location.pathname);
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    const categoryPath = findCategoryPath(azkarData, categoryId);
    if (categoryPath) {
      const timeoutId = window.setTimeout(() => {
        setNavigationStack(categoryPath);
        window.history.replaceState(null, '', window.location.pathname);
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [setsLoaded, customSets]);

  const handleSelect = (item: AzkarCategory | AzkarItem) => {
    if ('subCategories' in item || 'items' in item) {
      setNavigationStack(prev => [...prev, item as AzkarCategory]);
    }
  };

  useEffect(() => {
    if (!customSetId || customSet || !setsLoaded) return;
    const id = window.setTimeout(() => setNavigationStack(prev => prev.slice(0, -1)), 0);
    return () => window.clearTimeout(id);
  }, [customSetId, customSet, setsLoaded]);

  const handleBack = () => {
    if (navigationStack.length > 1) {
      setNavigationStack(prev => prev.slice(0, -1));
    }
  };

  const hasSubcategories = currentLevel.subCategories && currentLevel.subCategories.length > 0;
  const hasItems = currentLevel.items && currentLevel.items.length > 0;

  const currentItems = currentLevel.items ?? [];
  useEffect(() => {
    const id = window.setTimeout(clearDrag, 0);
    return () => window.clearTimeout(id);
  }, [currentLevel.id, clearDrag]);

  const selectedAzkar = drag.range ? currentItems.slice(drag.range.start, drag.range.end + 1) : [];
  const selectedCount = selectedAzkar.length;
  const azkarCountLabel = (n: number) => {
    if (!isArabic) return n === 1 ? '1 zikr selected' : `${n} azkar selected`;
    const d = String(n).replace(/\d/g, x => '٠١٢٣٤٥٦٧٨٩'[Number(x)]);
    if (n === 1) return 'ذكر واحد';
    if (n === 2) return 'ذكران';
    return n <= 10 ? `${d} أذكار` : `${d} ذكرًا`;
  };

  const currentName = isArabic ? (currentLevel.id === 'root' ? 'الأذكار' : currentLevel.nameAr) : currentLevel.name;
  const parentName = parentLevel ? (isArabic ? parentLevel.nameAr : parentLevel.name) : '';

  return (
    <div className="app-page azkar-page animate-fade-in">
      {navigationStack.length === 1 && <PageHeading title="Remember, every day" titleAr="ذكرٌ يرافق يومك" description="For the morning, the evening, and the moments between." descriptionAr="للصباح والمساء، ولحظاتك بينهما." />}
      {navigationStack.length === 1 && (
        <section className="mb-8" aria-labelledby="my-azkar-heading">
          <h2 id="my-azkar-heading" className="mb-1 text-base font-semibold tracking-tight">{isArabic ? 'أذكاري' : 'My azkar'}</h2>
          <CategoryGrid categories={customSets.map(customSetToCategory)} onSelect={handleSelect}>
            <button type="button" onClick={() => openNewSet()} className="azkar-category group">
              <div className="category-symbol"><Plus className="h-7 w-7" /></div>
              <h3 className="text-start text-base font-semibold leading-relaxed text-foreground/90">
                {isArabic ? 'مجموعة جديدة' : 'New set'}
              </h3>
            </button>
          </CategoryGrid>
        </section>
      )}

      <div className="flex items-center gap-3 mb-6">
        {navigationStack.length > 1 && (
          <Button variant="ghost" size="icon" onClick={handleBack} aria-label={isArabic ? 'رجوع' : 'Back'} className="bg-card border border-border h-11 w-11 rounded-xl shrink-0">
            <ArrowLeft className={isArabic ? 'w-5 h-5 rotate-180' : 'w-5 h-5'} />
          </Button>
        )}
        <div>
          <h2 className="text-base font-semibold tracking-tight">{currentName}</h2>
          {parentLevel && <p className="text-sm text-muted-foreground">{parentName}</p>}
        </div>
        {customSet && (
          <Button variant="outline" size="icon" onClick={() => openEditSet(customSet)} aria-label={isArabic ? 'تعديل المجموعة' : 'Edit set'}
            className="ms-auto h-11 w-11 shrink-0 rounded-xl">
            <PencilSimple className="h-5 w-5" />
          </Button>
        )}
        {hasItems && (
          <Button
            variant="outline"
            onClick={() => openShareImage({
              title: currentName,
              onePerItem: true,
              items: currentLevel.items!.map(item => ({ arabic: item.arabic, translation: item.translation, reference: currentName, repeat: item.repetitions })),
              shareText: azkarShareText(currentLevel.items!, currentName, isArabic),
            })}
            className={customSet ? 'h-11 gap-2 rounded-xl' : 'ms-auto h-11 gap-2 rounded-xl'}
          >
            <ShareNetwork className="h-4 w-4" />
            {isArabic ? 'مشاركة الأذكار' : 'Share azkar'}
          </Button>
        )}
      </div>

      {hasSubcategories && (
        <CategoryGrid categories={currentLevel.subCategories!} onSelect={handleSelect} />
      )}

      {hasItems && (
        <div ref={listRef} className="space-y-4">
          {currentLevel.items!.map((item, index) => (
            <ZikrCard key={currentLevel.id + ':' + index} item={item} categoryId={currentLevel.id} index={index} day={day} selectIndex={index} selected={drag.isSelected(index)} />
          ))}
        </div>
      )}

      {selectedCount > 0 && (
        <SelectionActionBar
          count={selectedCount}
          label={azkarCountLabel(selectedCount)}
          isArabic={isArabic}
          onCopy={() => {
            void navigator.clipboard.writeText(azkarShareText(selectedAzkar, currentName, isArabic));
            toast({ title: isArabic ? 'تم نسخ الأذكار' : 'Azkar copied' });
            clearDrag();
          }}
          onShare={() => openShareImage({
            title: currentName,
            onePerItem: true,
            items: selectedAzkar.map(z => ({ arabic: z.arabic, translation: z.translation, reference: currentName, repeat: z.repetitions })),
            shareText: azkarShareText(selectedAzkar, currentName, isArabic),
          })}
          onClear={clearDrag}
          onAdd={customSet ? undefined : () => {
            openAddToAzkar(selectedAzkar.map(({ arabic, translation, repetitions, note, source }) => ({ arabic, translation, repetitions, note, source })));
            clearDrag();
          }}
        />
      )}
    </div>
  );
}
