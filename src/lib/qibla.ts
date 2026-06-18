// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

/**
 * Calculate the Qibla direction (bearing) from a given location to the Kaaba.
 * Uses the forward azimuth formula from spherical trigonometry.
 *
 * @param lat - User's latitude in degrees
 * @param lng - User's longitude in degrees
 * @returns Bearing in degrees (0-360, where 0 = North, 90 = East)
 */
export function calculateQiblaDirection(lat: number, lng: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;

    const φ1 = toRad(lat);
    const φ2 = toRad(KAABA_LAT);
    const Δλ = toRad(KAABA_LNG - lng);

    const x = Math.sin(Δλ);
    const y = Math.cos(φ1) * Math.tan(φ2) - Math.sin(φ1) * Math.cos(Δλ);

    const bearing = toDeg(Math.atan2(x, y));

    // Normalize to 0-360
    return ((bearing % 360) + 360) % 360;
}

/**
 * Calculate the distance from a given location to the Kaaba using the Haversine formula.
 *
 * @param lat - User's latitude in degrees
 * @param lng - User's longitude in degrees
 * @returns Distance in kilometers
 */
export function calculateDistanceToKaaba(lat: number, lng: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371; // Earth's radius in km

    const φ1 = toRad(lat);
    const φ2 = toRad(KAABA_LAT);
    const Δφ = toRad(KAABA_LAT - lat);
    const Δλ = toRad(KAABA_LNG - lng);

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}
