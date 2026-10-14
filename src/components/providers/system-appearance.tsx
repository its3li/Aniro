'use client';

import { useEffect } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';

const AppAppearance = registerPlugin<{
    setTheme(options: { dark: boolean; background: string }): Promise<void>;
}>('AppAppearance');

export function SystemAppearance() {
    useEffect(() => {
        if (Capacitor.getPlatform() !== 'android') return;
        const root = document.documentElement;
        const sync = () => {
            const channels = getComputedStyle(document.body).backgroundColor.match(/\d+/g);
            if (!channels || channels.length < 3) return;
            const background = '#' + channels.slice(0, 3).map(value => Number(value).toString(16).padStart(2, '0')).join('');
            void AppAppearance.setTheme({ dark: root.classList.contains('dark'), background })
                .catch(error => console.warn('Could not sync system appearance', error));
        };
        sync();
        const observer = new MutationObserver(sync);
        observer.observe(root, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    return <div className="system-status-surface" aria-hidden="true" />;
}
