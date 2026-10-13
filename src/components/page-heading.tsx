'use client';
import Link from 'next/link';
import { ArrowUpRightIcon as ArrowUpRight } from '@/components/icons/interface-icons';
import { useSettings } from './providers/settings-provider';

export function PageHeading({ title, titleAr, description, descriptionAr }: {
  title: string; titleAr: string; description: string; descriptionAr: string;
}) {
  const { settings } = useSettings();
  const ar = settings.language === 'ar';
  return <header className="page-heading">
    <div className="page-heading-top"><Link href="/" className="brand-wordmark" data-arabic={ar} aria-label={ar ? 'أنيرو، الرئيسية' : 'Aniro home'}>{ar ? 'أنيرو' : 'aniro'}<span>.</span></Link><span className="section-kicker">{ar ? 'رفيق عبادتك' : 'Your daily companion'}</span></div>
    <h1>{ar ? titleAr : title}</h1>
    <p>{ar ? descriptionAr : description}</p>
    <ArrowUpRight className="page-heading-mark" aria-hidden="true" strokeWidth={1} />
  </header>;
}
