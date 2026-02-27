// App version - must match android/app/build.gradle versionCode and versionName
export const APP_VERSION = {
  versionCode: 7,
  versionName: '6.1',
};

// URL to check for updates - version.json is in the same repo as the code
const UPDATE_CHECK_URL = 'https://api.github.com/repos/its3li/Aniro-V3/contents/version.json';

// Landing page for downloads
const LANDING_PAGE_URL = 'https://aniro.vercel.app/';

export interface UpdateInfo {
  versionCode: number;
  versionName: string;
  apkUrl?: string;
  releaseNotes?: string;
  forceUpdate?: boolean;
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