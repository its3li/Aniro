'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { App } from '@capacitor/app';
import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import { useLocation } from './use-location';

const NativeCompass = registerPlugin<{
    start(options: { latitude: number; longitude: number }): Promise<void>;
    stop(): Promise<void>;
    addListener(event: 'heading', listener: (value: { heading: number }) => void): Promise<PluginListenerHandle>;
}>('Compass');

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
    const { coordinates } = useLocation();
    const latitude = coordinates?.latitude ?? 0;
    const longitude = coordinates?.longitude ?? 0;
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
        } else if (!isAbsoluteRef.current && event.absolute && event.alpha !== null) {
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
        if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Compass')) {
            let cancelled = false;
            let sensorListener: PluginListenerHandle | undefined;
            let appListener: PluginListenerHandle | undefined;
            const start = async () => {
                try {
                    await NativeCompass.start({ latitude, longitude });
                } catch {
                    if (!cancelled) setState(prev => ({ ...prev, heading: null, isSupported: false, error: 'Compass sensor unavailable' }));
                }
            };
            void (async () => {
                sensorListener = await NativeCompass.addListener('heading', ({ heading }) => {
                    if (!cancelled) setState({ heading, isSupported: true, hasPermission: true, error: null });
                });
                if (cancelled) { await sensorListener.remove(); return; }
                await start();
                appListener = await App.addListener('appStateChange', ({ isActive }) => {
                    if (isActive) void start();
                    else void NativeCompass.stop();
                });
                if (cancelled) { await appListener.remove(); await NativeCompass.stop(); }
            })();
            return () => {
                cancelled = true;
                void sensorListener?.remove();
                void appListener?.remove();
                void NativeCompass.stop();
            };
        }
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
            if (event.type === 'deviceorientationabsolute' || event.absolute || (event as WebKitDeviceOrientationEvent).webkitCompassHeading !== undefined) {
                received = true;
                setState(prev => ({ ...prev, isSupported: true, hasPermission: true }));
                handleOrientation(event);
            }
        };

        addOrientationListener('deviceorientationabsolute', testHandler);
        addOrientationListener('deviceorientation', testHandler);

        const timeoutId = window.setTimeout(() => {
            if (!received) {
                setState(prev => ({
                    ...prev,
                    isSupported: false,
                    error: 'Compass not available on this device',
                }));
                return;
            }

            // Keep listening: some Android sensors initialize after the timeout.
        }, 1000);

        return () => {
            window.clearTimeout(timeoutId);
            removeOrientationListener('deviceorientation', testHandler);
            removeOrientationListener('deviceorientationabsolute', testHandler);
            removeOrientationListener('deviceorientation', handleOrientation);
            removeOrientationListener('deviceorientationabsolute', handleOrientation);
        };
    }, [handleOrientation, latitude, longitude]);

    return { ...state, requestPermission };
}
