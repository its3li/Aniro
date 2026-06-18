import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';

export const prayerNameMapping = {
    fajr: { en: 'Fajr', ar: 'الفجر' },
    ishraq: { en: 'Ishraq', ar: 'الضحى' },
    dhuhr: { en: 'Dhuhr', ar: 'الظهر' },
    asr: { en: 'Asr', ar: 'العصر' },
    maghrib: { en: 'Maghrib', ar: 'المغرب' },
    isha: { en: 'Isha', ar: 'العشاء' },
};

export type PrayerName = keyof typeof prayerNameMapping;

export interface PrayerTime {
    name: PrayerName;
    time: string;
    date: Date;
}

export interface NextPrayer {
    name: PrayerName;
    date: Date;
    remaining: string;
}

export const calculationMethods = {
    muslim_world_league: 'Muslim World League',
    egyptian: 'Egyptian General Authority of Survey',
    karachi: 'University of Islamic Sciences, Karachi',
    umm_al_qura: 'Umm al-Qura University, Makkah',
    dubai: 'Dubai',
    qatar: 'Qatar',
    kuwait: 'Kuwait',
    moonsighting_committee: 'Moonsighting Committee',
    singapore: 'Singapore',
    north_america: 'ISNA (North America)',
    turkey: 'Turkey',
    tehran: 'Tehran',
    other: 'Other',
};

export const calculationMethodsArabic = {
    muslim_world_league: 'رابطة العالم الإسلامي',
    egyptian: 'الهيئة المصرية العامة للمساحة',
    karachi: 'جامعة العلوم الإسلامية، كراتشي',
    umm_al_qura: 'جامعة أم القرى، مكة',
    dubai: 'دبي',
    qatar: 'قطر',
    kuwait: 'الكويت',
    moonsighting_committee: 'لجنة رؤية الهلال',
    singapore: 'سنغافورة',
    north_america: 'أمريكا الشمالية',
    turkey: 'تركيا',
    tehran: 'طهران',
    other: 'أخرى',
};

export type CalculationMethodName = keyof typeof calculationMethods;

export type DSTMode = 'auto' | 'on' | 'off';

const DEFAULT_LAT = 21.4225;
const DEFAULT_LNG = 39.8262;
const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

export function getCalculationParams(method: CalculationMethodName) {
    switch (method) {
        case 'muslim_world_league': return CalculationMethod.MuslimWorldLeague();
        case 'egyptian': return CalculationMethod.Egyptian();
        case 'karachi': return CalculationMethod.Karachi();
        case 'umm_al_qura': return CalculationMethod.UmmAlQura();
        case 'dubai': return CalculationMethod.Dubai();
        case 'qatar': return CalculationMethod.Qatar();
        case 'kuwait': return CalculationMethod.Kuwait();
        case 'moonsighting_committee': return CalculationMethod.MoonsightingCommittee();
        case 'singapore': return CalculationMethod.Singapore();
        case 'north_america': return CalculationMethod.NorthAmerica();
        case 'turkey': return CalculationMethod.Turkey();
        case 'tehran': return CalculationMethod.Tehran();
        case 'other': return CalculationMethod.Other();
        default: return CalculationMethod.MuslimWorldLeague();
    }
}

function applyOffset(date: Date, offsetHours: number): Date {
    return new Date(date.getTime() + offsetHours * HOUR_MS);
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

export function getPrayerTimes(
    date: Date,
    lat: number = DEFAULT_LAT,
    lng: number = DEFAULT_LNG,
    offsetHours: number = 0,
    method: CalculationMethodName = 'muslim_world_league',
    includeIshraq: boolean = true
): PrayerTime[] {
    const coordinates = new Coordinates(lat, lng);
    const params = getCalculationParams(method);
    const prayerTimes = new PrayerTimes(coordinates, date, params);

    const entries: Array<{ name: PrayerName; date: Date }> = [
        { name: 'fajr', date: prayerTimes.fajr },
    ];

    if (includeIshraq) {
        entries.push({
            name: 'ishraq',
            date: new Date(prayerTimes.sunrise.getTime() + 20 * MINUTE_MS),
        });
    }

    entries.push(
        { name: 'dhuhr', date: prayerTimes.dhuhr },
        { name: 'asr', date: prayerTimes.asr },
        { name: 'maghrib', date: prayerTimes.maghrib },
        { name: 'isha', date: prayerTimes.isha },
    );

    return entries.map(entry => {
        const adjusted = applyOffset(entry.date, offsetHours);
        return {
            name: entry.name,
            date: adjusted,
            time: formatTime(adjusted),
        };
    });
}

export function getNextPrayer(
    lat: number = DEFAULT_LAT,
    lng: number = DEFAULT_LNG,
    offsetHours: number = 0,
    method: CalculationMethodName = 'muslim_world_league',
    includeIshraq: boolean = true,
    now: Date = new Date()
): NextPrayer | null {
    const todayPrayers = getPrayerTimes(now, lat, lng, offsetHours, method, includeIshraq);
    const nextPrayer = todayPrayers.find(prayer => prayer.date > now);

    let nextPrayerDate = nextPrayer?.date;
    let nextPrayerName = nextPrayer?.name;

    if (!nextPrayerDate || !nextPrayerName) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowPrayers = getPrayerTimes(tomorrow, lat, lng, offsetHours, method, includeIshraq);
        nextPrayerDate = tomorrowPrayers[0]?.date;
        nextPrayerName = tomorrowPrayers[0]?.name;
    }

    if (!nextPrayerDate || !nextPrayerName) return null;

    const diffMs = nextPrayerDate.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / HOUR_MS);
    const diffMins = Math.floor((diffMs % HOUR_MS) / MINUTE_MS);

    return {
        name: nextPrayerName,
        date: nextPrayerDate,
        remaining: `${diffHrs}h ${diffMins}m`,
    };
}

export function getTotalOffset(baseOffset: number, dstMode: DSTMode): number {
    return dstMode === 'on' ? baseOffset + 1 : baseOffset;
}

export function getPrayerTimesForRange(
    startDate: Date,
    days: number,
    lat: number = DEFAULT_LAT,
    lng: number = DEFAULT_LNG,
    offsetHours: number = 0,
    method: CalculationMethodName = 'muslim_world_league',
    includeIshraq: boolean = true
): { date: Date; prayers: PrayerTime[] }[] {
    return Array.from({ length: days }, (_, index) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + index);

        return {
            date,
            prayers: getPrayerTimes(date, lat, lng, offsetHours, method, includeIshraq),
        };
    });
}
