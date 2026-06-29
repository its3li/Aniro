import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { useSettings } from '@/components/providers/settings-provider';
import type { Language } from '@/components/providers/settings-provider';
import type { CalculationMethodName } from '@/lib/prayer';

type Coordinates = {
    latitude: number;
    longitude: number;
};

type LocationNames = {
    city: string | null;
    country: string | null;
};

type CachedLocation = Coordinates & {
    city?: string | null;
    country?: string | null;
    country_code?: string | null;
    countryCode?: string | null;
    names?: Partial<Record<Language, LocationNames>>;
    source?: 'device' | 'ip' | 'default';
    updatedAt?: number;
};

interface LocationState {
    coordinates: Coordinates | null;
    city: string | null;
    country: string | null;
    displayName: string | null;
    error: string | null;
    isLoading: boolean;
}

type BigDataCloudResponse = {
    latitude?: number;
    longitude?: number;
    city?: string;
    locality?: string;
    principalSubdivision?: string;
    countryName?: string;
    countryCode?: string;
};

const LOCATION_CACHE_KEY = 'aniro_location';
const GEOLOCATION_TIMEOUT_MS = 3500;
const FORCE_GEOLOCATION_TIMEOUT_MS = 7000;
const REVERSE_GEOCODE_TIMEOUT_MS = 3000;

const DEFAULT_LOCATION: CachedLocation = {
    latitude: 21.4225,
    longitude: 39.8262,
    countryCode: 'SA',
    names: {
        en: { city: 'Mecca', country: 'Saudi Arabia' },
        ar: { city: 'مكة', country: 'السعودية' },
    },
    source: 'default',
    updatedAt: 0,
};

let sharedDetectionPromise: Promise<CachedLocation | null> | null = null;

function getMethodForCountry(countryCode: string | null | undefined): CalculationMethodName {
    switch (countryCode?.toUpperCase()) {
        case 'EG': return 'egyptian';
        case 'PK': return 'karachi';
        case 'SA': return 'umm_al_qura';
        case 'AE': return 'dubai';
        case 'QA': return 'qatar';
        case 'KW': return 'kuwait';
        case 'SG': return 'singapore';
        case 'US':
        case 'CA': return 'north_america';
        case 'TR': return 'turkey';
        case 'IR': return 'tehran';
        default: return 'muslim_world_league';
    }
}

function isBrowser() {
    return typeof window !== 'undefined';
}

function toNumber(value: unknown): number | null {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function normalizeCachedLocation(value: unknown): CachedLocation | null {
    if (!value || typeof value !== 'object') return null;

    const data = value as Record<string, unknown>;
    const latitude = toNumber(data.latitude);
    const longitude = toNumber(data.longitude);

    if (latitude === null || longitude === null) return null;

    const countryCode =
        typeof data.countryCode === 'string'
            ? data.countryCode
            : typeof data.country_code === 'string'
                ? data.country_code
                : null;

    const names = typeof data.names === 'object' && data.names !== null
        ? data.names as CachedLocation['names']
        : undefined;

    return {
        latitude,
        longitude,
        city: typeof data.city === 'string' ? data.city : null,
        country: typeof data.country === 'string' ? data.country : null,
        countryCode,
        names,
        source: data.source === 'device' || data.source === 'ip' || data.source === 'default'
            ? data.source
            : undefined,
        updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : undefined,
    };
}

function readCachedLocation(): CachedLocation | null {
    if (!isBrowser()) return null;

    try {
        const raw = localStorage.getItem(LOCATION_CACHE_KEY);
        return raw ? normalizeCachedLocation(JSON.parse(raw)) : null;
    } catch {
        return null;
    }
}

function saveCachedLocation(location: CachedLocation) {
    if (!isBrowser()) return;

    try {
        localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(location));
    } catch {
        // Storage can be unavailable in private modes; the app still has in-memory state.
    }
}

function getCountryName(countryCode: string | null | undefined, language: Language): string | null {
    if (!countryCode || typeof Intl === 'undefined' || !('DisplayNames' in Intl)) return null;

    try {
        return new Intl.DisplayNames([language], { type: 'region' }).of(countryCode.toUpperCase()) ?? null;
    } catch {
        return null;
    }
}

function namesForLanguage(location: CachedLocation, language: Language): LocationNames {
    const localized = location.names?.[language];
    const english = location.names?.en;
    const countryCode = location.countryCode ?? location.country_code;

    return {
        city: localized?.city ?? location.city ?? english?.city ?? null,
        country:
            localized?.country ??
            getCountryName(countryCode, language) ??
            location.country ??
            english?.country ??
            null,
    };
}

function toState(location: CachedLocation, language: Language, error: string | null = null): LocationState {
    const names = namesForLanguage(location, language);
    const displayName = [names.city, names.country].filter(Boolean).join(', ') || null;

    return {
        coordinates: {
            latitude: location.latitude,
            longitude: location.longitude,
        },
        city: names.city,
        country: names.country,
        displayName,
        error,
        isLoading: false,
    };
}

function hasNamesForLanguage(location: CachedLocation, language: Language) {
    const names = location.names?.[language];
    return Boolean(names?.city || names?.country);
}

function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    return fetch(url, {
        signal: controller.signal,
        headers: {
            Accept: 'application/json',
        },
    }).finally(() => window.clearTimeout(timeoutId));
}

async function getDeviceCoordinates(timeoutMs = GEOLOCATION_TIMEOUT_MS): Promise<Coordinates | null> {
    if (!isBrowser()) return null;

    if (Capacitor.isNativePlatform()) {
        const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: false,
            timeout: timeoutMs,
            maximumAge: 24 * 60 * 60 * 1000,
        });

        return {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
        };
    }

    if (!navigator.geolocation) return null;

    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            () => resolve(null),
            {
                enableHighAccuracy: false,
                timeout: timeoutMs,
                maximumAge: 24 * 60 * 60 * 1000,
            }
        );
    });
}

async function reverseGeocode(coordinates: Coordinates | null, language: Language): Promise<CachedLocation | null> {
    if (!isBrowser() || navigator.onLine === false) return null;

    const params = new URLSearchParams({
        localityLanguage: language,
    });

    if (coordinates) {
        params.set('latitude', String(coordinates.latitude));
        params.set('longitude', String(coordinates.longitude));
    }

    const response = await fetchWithTimeout(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?${params.toString()}`,
        REVERSE_GEOCODE_TIMEOUT_MS
    );

    if (!response.ok) return null;

    const data = await response.json() as BigDataCloudResponse;
    const latitude = coordinates?.latitude ?? toNumber(data.latitude);
    const longitude = coordinates?.longitude ?? toNumber(data.longitude);

    if (latitude === null || longitude === null) return null;

    const city = data.city || data.locality || data.principalSubdivision || null;
    const country = data.countryName || null;

    return {
        latitude,
        longitude,
        countryCode: data.countryCode ?? null,
        names: {
            [language]: { city, country },
        },
        source: coordinates ? 'device' : 'ip',
        updatedAt: Date.now(),
    };
}

async function detectFreshLocation(language: Language, forceRefresh: boolean): Promise<CachedLocation | null> {
    const timeout = forceRefresh ? FORCE_GEOLOCATION_TIMEOUT_MS : GEOLOCATION_TIMEOUT_MS;
    const deviceCoordinates = await getDeviceCoordinates(timeout);
    const detected = await reverseGeocode(deviceCoordinates, language);

    if (detected) {
        return detected;
    }

    if (!deviceCoordinates) {
        return reverseGeocode(null, language);
    }

    return {
        ...deviceCoordinates,
        source: 'device',
        updatedAt: Date.now(),
    };
}

function detectLocation(language: Language, forceRefresh: boolean): Promise<CachedLocation | null> {
    if (forceRefresh) {
        return detectFreshLocation(language, true);
    }

    if (!sharedDetectionPromise) {
        sharedDetectionPromise = detectFreshLocation(language, false).finally(() => {
            sharedDetectionPromise = null;
        });
    }

    return sharedDetectionPromise;
}

async function refreshLocalizedNames(location: CachedLocation, language: Language): Promise<CachedLocation | null> {
    const localized = await reverseGeocode(
        {
            latitude: location.latitude,
            longitude: location.longitude,
        },
        language
    );

    if (!localized) return null;

    const merged = mergeLocations(readCachedLocation() ?? location, localized);
    saveCachedLocation(merged);
    return merged;
}

function mergeLocations(previous: CachedLocation | null, next: CachedLocation): CachedLocation {
    const countryCode = next.countryCode ?? next.country_code ?? previous?.countryCode ?? previous?.country_code ?? null;
    const mergedNames = {
        ...(previous?.names ?? {}),
        ...(next.names ?? {}),
    };

    return {
        latitude: next.latitude,
        longitude: next.longitude,
        countryCode,
        city: next.city ?? previous?.city ?? null,
        country: next.country ?? previous?.country ?? null,
        names: mergedNames,
        source: next.source ?? previous?.source,
        updatedAt: next.updatedAt ?? Date.now(),
    };
}

export function useLocation() {
    const { settings, setCalculationMethod } = useSettings();
    const language = settings.language;

    const [state, setState] = useState<LocationState>(() => {
        return toState(DEFAULT_LOCATION, language);
    });

    const loadLocation = useCallback(async (forceRefresh = false) => {
        const cached = readCachedLocation();
        const baseline = cached ?? DEFAULT_LOCATION;

        setState({
            ...toState(baseline, language),
            isLoading: forceRefresh,
        });

        const baselineCountryCode = baseline.countryCode ?? baseline.country_code;
        if (baselineCountryCode) {
            setCalculationMethod(getMethodForCountry(baselineCountryCode));
        }

        if (cached && cached.source !== 'default' && !forceRefresh) {
            if (!hasNamesForLanguage(cached, language)) {
                void refreshLocalizedNames(cached, language).then((localized) => {
                    if (localized) {
                        setState(toState(localized, language));
                    }
                });
            }
            return;
        }

        if (!isBrowser() || (navigator.onLine === false && !forceRefresh)) {
            if (!cached) {
                saveCachedLocation(DEFAULT_LOCATION);
            }
            return;
        }

        try {
            const detected = await detectLocation(language, forceRefresh);

            if (!detected) {
                throw new Error('Location unavailable');
            }

            const merged = mergeLocations(cached, detected);
            saveCachedLocation(merged);

            const countryCode = merged.countryCode ?? merged.country_code;
            if (countryCode) {
                setCalculationMethod(getMethodForCountry(countryCode));
            }

            setState(toState(merged, language));

            const otherLanguage: Language = language === 'en' ? 'ar' : 'en';
            if (!hasNamesForLanguage(merged, otherLanguage)) {
                void refreshLocalizedNames(merged, otherLanguage);
            }
        } catch {
            const fallback = cached ?? DEFAULT_LOCATION;
            const error = cached
                ? null
                : language === 'ar'
                    ? 'تعذر تحديد الموقع. يتم استخدام مكة مؤقتا.'
                    : 'Could not determine location. Using Mecca for now.';

            if (!cached) {
                saveCachedLocation(DEFAULT_LOCATION);
            }

            setState(toState(fallback, language, error));
        }
    }, [language, setCalculationMethod]);

    useEffect(() => {
        loadLocation(false);
    }, [loadLocation]);

    const refreshLocation = useCallback(() => {
        return loadLocation(true);
    }, [loadLocation]);

    return { ...state, refreshLocation };
}
