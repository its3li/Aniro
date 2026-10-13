'use client';

import { QiblaCompass } from '@/components/qibla/qibla-compass';
import { useSettings } from '@/components/providers/settings-provider';
import { PageHeading } from '@/components/page-heading';

export default function QiblaPage() {
    const { settings } = useSettings();
    const isArabic = settings.language === 'ar';

    return (
        <div className="app-page qibla-page animate-fade-in">
            <PageHeading title="Find your direction" titleAr="وجهتك إلى القبلة" description="Hold your phone flat and turn toward the Kaaba." descriptionAr="أمسك هاتفك أفقيًا، واستدر باتجاه الكعبة." />
            <p className="section-kicker">{isArabic ? 'القبلة' : 'Qibla'}</p>
            <QiblaCompass />
        </div>
    );
}
