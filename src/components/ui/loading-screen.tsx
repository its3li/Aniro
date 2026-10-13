'use client';

import { SpinnerGapIcon as LoaderCircle } from '@/components/icons/interface-icons';
import { useSettings } from '../providers/settings-provider';

export function LoadingScreen() {
    const { settings } = useSettings();
    // Fixed text to avoid hydration issues - no language dependency during load
    return (
        <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
            suppressHydrationWarning
        >
            <div
                className="flex flex-col items-center gap-6 p-8"
                suppressHydrationWarning
            >
                <span className="brand-wordmark" data-arabic={settings.language === 'ar'}>{settings.language === 'ar' ? 'أنيرو' : 'aniro'}<span>.</span></span>
                <LoaderCircle className="w-5 h-5 text-primary animate-spin" />
                <p
                    className="text-lg font-medium text-muted-foreground animate-pulse"
                    suppressHydrationWarning
                >
                    صل علي النبي
                </p>
            </div>
        </div>
    );
}
