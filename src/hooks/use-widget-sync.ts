import { useEffect } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { useLocation } from './use-location';
import { useSettings } from '@/components/providers/settings-provider';

type WidgetCoordinates = {
    latitude: number;
    longitude: number;
};

interface WidgetDataPlugin {
    updateData(options: {
        latitude: number;
        longitude: number;
        calculationMethod: string;
        prayerOffset: number;
        dstMode: string;
        widgetBackgroundColor: string;
        useSystemWidgetColor: boolean;
        language: string;
        azanMode: string;
        includeIshraq: boolean;
        fajrQuizEnabled: boolean;
        timeFormat: string;
    }): Promise<void>;
}

const WidgetData = registerPlugin<WidgetDataPlugin>('WidgetData');
const LOCATION_CACHE_KEY = 'aniro_location';
const DEFAULT_COORDINATES: WidgetCoordinates = {
    latitude: 21.4225,
    longitude: 39.8262,
};

function readCachedCoordinates(): WidgetCoordinates | null {
    if (typeof window === 'undefined') return null;

    try {
        const raw = localStorage.getItem(LOCATION_CACHE_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as Partial<WidgetCoordinates>;
        const latitude = Number(parsed.latitude);
        const longitude = Number(parsed.longitude);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
        return { latitude, longitude };
    } catch {
        return null;
    }
}

export function useWidgetSync() {
    const { coordinates } = useLocation();
    const { settings } = useSettings();
    const {
        calculationMethod,
        prayerOffset,
        dstMode,
        widgetTheme,
        widgetBackgroundColor,
        language,
        azanMode,
        includeIshraq,
        fajrQuizEnabled,
        timeFormat,
    } = settings;

    useEffect(() => {
        if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('WidgetData')) {
            return;
        }

        const widgetCoordinates = coordinates ?? readCachedCoordinates() ?? DEFAULT_COORDINATES;

        WidgetData.updateData({
            latitude: widgetCoordinates.latitude,
            longitude: widgetCoordinates.longitude,
            calculationMethod,
            prayerOffset,
            dstMode,
            widgetBackgroundColor: widgetTheme === 'default' ? '#24252B' : widgetBackgroundColor,
            useSystemWidgetColor: widgetTheme === 'system',
            language,
            azanMode,
            includeIshraq,
            fajrQuizEnabled,
            timeFormat,
        }).catch(err => console.error('Failed to sync widget data:', err));
    }, [coordinates, calculationMethod, prayerOffset, dstMode, widgetTheme, widgetBackgroundColor, language, azanMode, includeIshraq, fajrQuizEnabled, timeFormat]);
}
