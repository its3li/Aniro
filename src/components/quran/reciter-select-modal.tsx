
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { useSettings } from '../providers/settings-provider';
import { Button } from '../ui/button';
import { CheckCircleIcon as CheckCircle } from '@/components/icons/interface-icons';
import { cn } from '@/lib/utils';

interface ReciterSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (identifier: string) => void;
}

export function ReciterSelectModal({ isOpen, onClose, onSelect }: ReciterSelectModalProps) {
  const { settings, availableReciters } = useSettings();
  const isArabic = settings.language === 'ar';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background/80 backdrop-blur-2xl border-foreground/20 rounded-3xl" dir={isArabic ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{isArabic ? 'اختر القارئ' : 'Select Reciter'}</DialogTitle>
          <DialogDescription>
            {isArabic ? 'سيتم حفظ اختيارك للاستخدام في المستقبل.' : 'Your selection will be saved for future use.'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-72">
            <div className="flex flex-col gap-2 p-1">
                {availableReciters.map((reciter) => (
                    <Button 
                        key={reciter.identifier} 
                        variant="ghost"
                        className={cn("flex justify-between items-center w-full h-auto py-3 px-4 text-base", settings.quranReciter === reciter.identifier && 'bg-primary/10 text-primary')}
                        onClick={() => onSelect(reciter.identifier)}
                    >
                        <div className='text-start'>
                            <p className="font-bold">{isArabic ? reciter.name : reciter.englishName}</p>
                            {isArabic && <p className="text-sm text-muted-foreground">{reciter.englishName}</p>}
                        </div>
                        {settings.quranReciter === reciter.identifier && <CheckCircle className="w-5 h-5" />}
                    </Button>
                ))}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
