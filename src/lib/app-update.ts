// App version - must match android/app/build.gradle versionCode and versionName
export const APP_VERSION = {
  versionCode: 13,
  versionName: '6.7',
};

// URL to check for updates - version.json is in the same repo as the code
const UPDATE_CHECK_URL = 'https://api.github.com/repos/its3li/Aniro/contents/version.json';

// Landing page for downloads
const LANDING_PAGE_URL = 'https://github.com/its3li/Aniro/releases/latest';

export interface UpdateInfo {
  versionCode: number;
  versionName: string;
  apkUrl?: string;
  sha256?: string;
  releaseNotes?: string;
  forceUpdate?: boolean;
  minSupportedVersionCode?: number;
  rollout?: number;
}

/**
 * Check if an update is available
 * Returns null if no update, or UpdateInfo if update available
 */
export async function checkForUpdate(): Promise<UpdateInfo | null> {
  try {
    const response = await fetch(UPDATE_CHECK_URL, {
      headers: {
        'Accept': 'application/vnd.github.v3.raw',
      },
    });

    if (!response.ok) {
      console.error('Failed to check for updates:', response.status);
      return null;
    }

    const updateInfo: UpdateInfo = await response.json();
    if (typeof updateInfo.rollout === 'number' && updateInfo.rollout < 100) {
      const bucket = APP_VERSION.versionCode % 100;
      if (bucket >= updateInfo.rollout) {
        return null;
      }
    }

    // Compare version codes
    if (updateInfo.versionCode > APP_VERSION.versionCode) {
      return updateInfo;
    }

    return null;
  } catch (error) {
    console.error('Error checking for updates:', error);
    return null;
  }
}

/**
 * Get the landing page URL for downloads
 */
export function getUpdateUrl(): string {
  return LANDING_PAGE_URL;
}
