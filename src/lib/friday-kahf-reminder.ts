import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { Language } from '@/components/providers/settings-provider';
import { pickLanguage } from '@/lib/i18n';
import { getPrayerTimes, getTotalOffset, type CalculationMethodName, type DSTMode } from './prayer';

type KahfReminderSettings = {
  language: Language;
  prayerOffset: number;
  dstMode: DSTMode;
  calculationMethod: CalculationMethodName;
};

type CachedLocation = {
  latitude?: number;
  longitude?: number;
};

const LOCATION_CACHE_KEY = 'aniro_location';
const KAHF_REMINDER_BASE_ID = 18018;
const FRIDAYS_TO_SCHEDULE = 6;
const REMINDER_OFFSETS_MINUTES = [-20, 0, 20];

function readCachedCoordinates() {
  if (typeof window === 'undefined') return {};

  try {
    const raw = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!raw) return {};

    const location = JSON.parse(raw) as CachedLocation;
    const latitude = Number(location.latitude);
    const longitude = Number(location.longitude);

    return {
      latitude: Number.isFinite(latitude) ? latitude : undefined,
      longitude: Number.isFinite(longitude) ? longitude : undefined,
    };
  } catch {
    return {};
  }
}

function getUpcomingFridayDates(count: number, now = new Date()) {
  const dates: Date[] = [];
  const firstFriday = new Date(now);
  const daysUntilFriday = (5 - firstFriday.getDay() + 7) % 7;
  firstFriday.setDate(firstFriday.getDate() + daysUntilFriday);
  firstFriday.setHours(12, 0, 0, 0);

  if (firstFriday.getDay() === now.getDay() && now.getTime() > firstFriday.getTime() + 20 * 60_000) {
    firstFriday.setDate(firstFriday.getDate() + 7);
  }

  for (let index = 0; index < count; index += 1) {
    const date = new Date(firstFriday);
    date.setDate(firstFriday.getDate() + index * 7);
    dates.push(date);
  }

  return dates;
}

function reminderCopy(language: Language, offsetMinutes: number) {
  if (offsetMinutes < 0) {
    return pickLanguage(language, {
      ar: {
        title: 'اقترب وقت سورة الكهف',
        body: 'باقي حوالي 20 دقيقة على الظهر، وقت مناسب لقراءة سورة الكهف.',
      },
      en: {
        title: 'Surah Al-Kahf soon',
        body: 'Dhuhr is in about 20 minutes. This is a good time to read Surah Al-Kahf.',
      },
      ur: {
        title: 'سورۃ الکہف کا وقت قریب ہے',
        body: 'ظہر میں تقریباً 20 منٹ باقی ہیں، سورۃ الکہف پڑھنے کا اچھا وقت ہے۔',
      },
      fa: {
        title: 'زمان سوره کهف نزدیک است',
        body: 'حدود 20 دقیقه تا ظهر مانده است؛ زمان خوبی برای خواندن سوره کهف است.',
      },
    });
  }

  if (offsetMinutes > 0) {
    return pickLanguage(language, {
      ar: {
        title: 'تذكير سورة الكهف',
        body: 'مر حوالي 20 دقيقة بعد الظهر، لا تنس قراءة سورة الكهف اليوم.',
      },
      en: {
        title: 'Surah Al-Kahf reminder',
        body: 'It is about 20 minutes after Dhuhr. Remember to read Surah Al-Kahf today.',
      },
      ur: {
        title: 'سورۃ الکہف کی یاد دہانی',
        body: 'ظہر کے تقریباً 20 منٹ بعد کا وقت ہے، آج سورۃ الکہف پڑھنا نہ بھولیں۔',
      },
      fa: {
        title: 'یادآوری سوره کهف',
        body: 'حدود 20 دقیقه از ظهر گذشته است؛ خواندن سوره کهف امروز را فراموش نکنید.',
      },
    });
  }

  return pickLanguage(language, {
    ar: {
      title: 'وقت سورة الكهف',
      body: 'حان وقت الظهر، لا تنس قراءة سورة الكهف اليوم.',
    },
    en: {
      title: 'Surah Al-Kahf time',
      body: 'It is Dhuhr time. Remember to read Surah Al-Kahf today.',
    },
    ur: {
      title: 'سورۃ الکہف کا وقت',
      body: 'ظہر کا وقت ہو گیا ہے، آج سورۃ الکہف پڑھنا نہ بھولیں۔',
    },
    fa: {
      title: 'زمان سوره کهف',
      body: 'وقت ظهر است؛ خواندن سوره کهف امروز را فراموش نکنید.',
    },
  });
}

export async function scheduleFridayKahfReminder(settings: KahfReminderSettings) {
  if (!Capacitor.isNativePlatform()) return;

  const permission = await LocalNotifications.checkPermissions();
  if (permission.display !== 'granted') return;

  const now = new Date();
  const coordinates = readCachedCoordinates();
  const totalOffset = getTotalOffset(settings.prayerOffset, settings.dstMode);
  const notificationIds = Array.from(
    { length: FRIDAYS_TO_SCHEDULE * REMINDER_OFFSETS_MINUTES.length },
    (_, index) => ({ id: KAHF_REMINDER_BASE_ID + index })
  );

  await LocalNotifications.cancel({ notifications: notificationIds }).catch(() => undefined);

  const notifications = getUpcomingFridayDates(FRIDAYS_TO_SCHEDULE, now)
    .flatMap((friday, fridayIndex) => {
      const dhuhr = getPrayerTimes(
        friday,
        coordinates.latitude,
        coordinates.longitude,
        totalOffset,
        settings.calculationMethod,
        false
      ).find(prayer => prayer.name === 'dhuhr');

      if (!dhuhr) return [];

      return REMINDER_OFFSETS_MINUTES.map((offsetMinutes, offsetIndex) => {
        const scheduleAt = new Date(dhuhr.date.getTime() + offsetMinutes * 60_000);
        if (scheduleAt <= now) return null;

        const copy = reminderCopy(settings.language, offsetMinutes);
        return {
          id: KAHF_REMINDER_BASE_ID + fridayIndex * REMINDER_OFFSETS_MINUTES.length + offsetIndex,
          title: copy.title,
          body: copy.body,
          schedule: {
            at: scheduleAt,
            allowWhileIdle: true,
          },
          extra: {
            route: '/quran?surah=18',
          },
        };
      });
    })
    .filter((notification): notification is NonNullable<typeof notification> => Boolean(notification));

  if (notifications.length === 0) return;

  await LocalNotifications.schedule({ notifications });
}

