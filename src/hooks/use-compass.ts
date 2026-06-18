'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface CompassState {
    /** Device heading in degrees (0-360, 0 = North). null if unavailable. */
    heading: number | null;
    /** Whether the device compass sensor is supported. */
    isSupported: boolean;
    /** Whether permission has been granted (relevant for iOS 13+). */
    hasPermission: boolean;
    /** Error message if any. */
    error: string | null;
}

interface WebKitDeviceOrientationEvent extends DeviceOrientationEvent {
    webkitCompassHeading?: number;
}

interface DeviceOrientationEventConstructorWithPermission {
    requestPermission?: () => Promise<'granted' | 'denied' | 'prompt'>;
}

type OrientationEventName = 'deviceorientation' | 'deviceorientationabsolute';

function getDeviceOrientationConstructor() {
    return DeviceOrientationEvent as unknown as DeviceOrientationEventConstructorWithPermission;
}

function addOrientationListener(
    eventName: OrientationEventName,
    listener: (event: DeviceOrientationEvent) => void
) {
    window.addEventListener(eventName, listener as EventListener, true);
}

function removeOrientationListener(
    eventName: OrientationEventName,
    listener: (event: DeviceOrientationEvent) => void
) {
    window.removeEventListener(eventName, listener as EventListener, true);
}

/**
 * Hook to access the device compass heading via the DeviceOrientationEvent API.
 * Handles iOS permission requests and Android auto-fire.
 */
export function useCompass() {
    const [state, setState] = useState<CompassState>({
        heading: null,
        isSupported: false,
        hasPermission: false,
        error: null,
    });
    const isAbsoluteRef = useRef(false);

    const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
        let heading: number | null = null;
        const isAbsoluteEvent = event.type === 'deviceorientationabsolute';

        if (isAbsoluteEvent) {
            isAbsoluteRef.current = true;
        }

        const webkitEvent = event as WebKitDeviceOrientationEvent;
        if (webkitEvent.webkitCompassHeading !== undefined) {
            heading = webkitEvent.webkitCompassHeading;
        } else if (isAbsoluteEvent && event.alpha !== null) {
            heading = 360 - event.alpha;
        } else if (!isAbsoluteRef.current && event.alpha !== null) {
            heading = 360 - event.alpha;
        }

        if (heading !== null) {
            heading = (heading % 360 + 360) % 360;
            const roundedHeading = Math.round(heading);
            setState(prev => ({
                ...prev,
                heading: roundedHeading,
                isSupported: true,
                hasPermission: true,
                error: null,
            }));
        }
    }, []);

    const requestPermission = useCallback(async () => {
        try {
            const permissionRequester = getDeviceOrientationConstructor().requestPermission;
            if (typeof permissionRequester === 'function') {
                const permission = await permissionRequester();
                if (permission === 'granted') {
                    addOrientationListener('deviceorientation', handleOrientation);
                    setState(prev => ({ ...prev, hasPermission: true, isSupported: true }));
                } else {
                    setState(prev => ({
                        ...prev,
                        hasPermission: false,
                        error: 'Compass permission denied',
                    }));
                }
                return;
            }

            addOrientationListener('deviceorientationabsolute', handleOrientation);
            addOrientationListener('deviceorientation', handleOrientation);
            setState(prev => ({ ...prev, hasPermission: true }));
        } catch {
            setState(prev => ({
                ...prev,
                error: 'Failed to request compass permission',
            }));
        }
    }, [handleOrientation]);

    useEffect(() => {
        if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
            const timeoutId = globalThis.setTimeout(() => {
                setState(prev => ({
                    ...prev,
                    isSupported: false,
                    error: 'Compass not available on this device',
                }));
            }, 0);

            return () => globalThis.clearTimeout(timeoutId);
        }

        const permissionRequester = getDeviceOrientationConstructor().requestPermission;
        if (typeof permissionRequester === 'function') {
            const timeoutId = window.setTimeout(() => {
                setState(prev => ({ ...prev, isSupported: true, hasPermission: false }));
            }, 0);

            return () => window.clearTimeout(timeoutId);
        }

        let received = false;
        const testHandler = (event: DeviceOrientationEvent) => {
            if (event.alpha !== null) {
                received = true;
                setState(prev => ({ ...prev, isSupported: true, hasPermission: true }));
                handleOrientation(event);
            }
        };

        addOrientationListener('deviceorientationabsolute', testHandler);
        addOrientationListener('deviceorientation', testHandler);

        const timeoutId = window.setTimeout(() => {
            removeOrientationListener('deviceorientationabsolute', testHandler);
            removeOrientationListener('deviceorientation', testHandler);

            if (!received) {
                setState(prev => ({
                    ...prev,
                    isSupported: false,
                    error: 'Compass not available on this device',
                }));
                return;
            }

            addOrientationListener('deviceorientationabsolute', handleOrientation);
            addOrientationListener('deviceorientation', handleOrientation);
        }, 1000);

        return () => {
            window.clearTimeout(timeoutId);
            removeOrientationListener('deviceorientation', testHandler);
            removeOrientationListener('deviceorientationabsolute', testHandler);
            removeOrientationListener('deviceorientation', handleOrientation);
            removeOrientationListener('deviceorientationabsolute', handleOrientation);
        };
    }, [handleOrientation]);

    return { ...state, requestPermission };
}
