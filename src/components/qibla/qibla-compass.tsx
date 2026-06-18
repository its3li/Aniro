'use client';

import { useMemo } from 'react';
import { useLocation } from '@/hooks/use-location';
import { useCompass } from '@/hooks/use-compass';
import { useSettings } from '@/components/providers/settings-provider';
import { calculateQiblaDirection, calculateDistanceToKaaba } from '@/lib/qibla';
import { GlassCard, GlassCardContent } from '@/components/glass-card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Compass, Navigation, MapPin, LocateFixed } from 'lucide-react';

export function QiblaCompass() {
    const { coordinates, displayName, isLoading: locationLoading } = useLocation();
    const { heading, isSupported, hasPermission, requestPermission } = useCompass();
    const { settings } = useSettings();
    const isArabic = settings.language === 'ar';

    const qiblaBearing = useMemo(
        () => coordinates ? calculateQiblaDirection(coordinates.latitude, coordinates.longitude) : null,
        [coordinates]
    );
    const distance = useMemo(
        () => coordinates ? calculateDistanceToKaaba(coordinates.latitude, coordinates.longitude) : null,
        [coordinates]
    );

    // The rotation of the compass dial (opposite of heading so the compass stays fixed on North)
    const compassRotation = heading !== null ? -heading : 0;

    // The angle of the Qibla needle relative to North on the compass dial
    const qiblaAngle = qiblaBearing ?? 0;

    // Whether we have a live compass and it's pointing roughly toward Qibla (within ±5°)
    const isAligned = heading !== null && qiblaBearing !== null &&
        Math.abs(((heading - qiblaBearing + 180 + 360) % 360) - 180) < 5;

    const formatNumber = (n: number): string => {
        if (!isArabic) return Math.round(n).toString();
        return Math.round(n).toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
    };

    // Cardinal directions
    const cardinals = isArabic
        ? [{ label: 'ش', angle: 0 }, { label: 'شر', angle: 90 }, { label: 'ج', angle: 180 }, { label: 'غ', angle: 270 }]
        : [{ label: 'N', angle: 0 }, { label: 'E', angle: 90 }, { label: 'S', angle: 180 }, { label: 'W', angle: 270 }];

    if (locationLoading) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
                <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                <p className="text-muted-foreground">{isArabic ? 'جاري تحديد موقعك...' : 'Determining your location...'}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Compass Container */}
            <div className="premium-panel relative flex items-center justify-center w-[80vw] h-[80vw] max-w-[320px] max-h-[320px] rounded-[2rem]">
                {/* Glow effect when aligned */}
                <div
                    className="absolute inset-0 rounded-full transition-all duration-700"
                    style={{
                        background: isAligned
                            ? 'radial-gradient(circle, hsl(38 92% 50% / 0.2) 0%, transparent 70%)'
                            : 'none',
                        transform: isAligned ? 'scale(1.15)' : 'scale(1)',
                    }}
                />

                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-2 border-foreground/10" />
                <div className="absolute inset-2 rounded-full border border-foreground/5" />

                {/* Rotating compass dial */}
                <div
                    className="absolute inset-4 rounded-full"
                    style={{
                        transform: `rotate(${compassRotation}deg)`,
                        transition: heading !== null ? 'transform 0.3s ease-out' : 'none',
                    }}
                >
                    {/* Tick marks */}
                    <svg viewBox="0 0 300 300" className="w-full h-full">
                        {/* Degree ticks */}
                        {Array.from({ length: 72 }, (_, i) => {
                            const angle = i * 5;
                            const isMajor = angle % 90 === 0;
                            const isMedium = angle % 30 === 0;
                            const outerR = 145;
                            const innerR = isMajor ? 125 : isMedium ? 130 : 135;
                            const rad = (angle * Math.PI) / 180;
                            const x1 = 150 + outerR * Math.sin(rad);
                            const y1 = 150 - outerR * Math.cos(rad);
                            const x2 = 150 + innerR * Math.sin(rad);
                            const y2 = 150 - innerR * Math.cos(rad);

                            return (
                                <line
                                    key={angle}
                                    x1={x1} y1={y1} x2={x2} y2={y2}
                                    stroke={isMajor ? 'hsl(38 92% 50%)' : 'currentColor'}
                                    strokeWidth={isMajor ? 2.5 : isMedium ? 1.5 : 0.8}
                                    opacity={isMajor ? 1 : isMedium ? 0.5 : 0.25}
                                    className="text-foreground"
                                />
                            );
                        })}

                        {/* Cardinal direction labels */}
                        {cardinals.map(({ label, angle }) => {
                            const r = 112;
                            const rad = (angle * Math.PI) / 180;
                            const x = 150 + r * Math.sin(rad);
                            const y = 150 - r * Math.cos(rad);

                            return (
                                <text
                                    key={label}
                                    x={x} y={y}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fill={angle === 0 ? 'hsl(38 92% 50%)' : 'currentColor'}
                                    className="text-foreground"
                                    fontSize={angle === 0 ? 18 : 14}
                                    fontWeight="bold"
                                >
                                    {label}
                                </text>
                            );
                        })}

                        {/* Qibla needle / Kaaba indicator */}
                        {qiblaBearing !== null && (
                            <g transform={`rotate(${qiblaAngle}, 150, 150)`}>
                                {/* Needle line */}
                                <line
                                    x1={150} y1={150} x2={150} y2={30}
                                    stroke="hsl(38 92% 50%)"
                                    strokeWidth={3}
                                    strokeLinecap="round"
                                    opacity={0.8}
                                />
                                {/* Kaaba icon at tip */}
                                <rect
                                    x={139} y={18} width={22} height={22}
                                    rx={3} ry={3}
                                    fill="hsl(218 54% 18%)"
                                    stroke="hsl(38 92% 60%)"
                                    strokeWidth={1.5}
                                />
                                <path
                                    d="M142 26h16v4h-16zM145 33h10v4h-10z"
                                    fill="hsl(38 92% 56%)"
                                />
                                <path
                                    d="M150 45l-6 -8h12z"
                                    fill="hsl(38 92% 56%)"
                                />
                            </g>
                        )}

                        {/* Center point */}
                        <circle cx={150} cy={150} r={6} fill="hsl(38 92% 50%)" opacity={0.9} />
                        <circle cx={150} cy={150} r={3} fill="hsl(222 47% 11%)" />
                    </svg>
                </div>

                {/* Fixed North pointer at top */}
                {heading !== null && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10">
                        <div className="w-3 h-3 bg-primary rotate-45 rounded-sm" />
                    </div>
                )}
            </div>

            {/* Bearing info */}
            <GlassCard className="w-full">
                <GlassCardContent className="p-5 pt-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10">
                                <Navigation className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{isArabic ? 'اتجاه القبلة' : 'Qibla Direction'}</p>
                                <p className="text-2xl font-bold font-mono text-primary">
                                    {qiblaBearing !== null ? `${formatNumber(qiblaBearing)}°` : '—'}
                                </p>
                            </div>
                        </div>
                        {distance !== null && (
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">{isArabic ? 'المسافة للكعبة' : 'Distance to Kaaba'}</p>
                                <p className="text-lg font-semibold">
                                    {formatNumber(distance)} {isArabic ? 'كم' : 'km'}
                                </p>
                            </div>
                        )}
                    </div>
                </GlassCardContent>
            </GlassCard>

            {/* Location info */}
            {displayName && (
                <GlassCard className="w-full">
                    <GlassCardContent className="p-4 pt-4">
                        <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            <div>
                                <p className="text-sm text-muted-foreground">{isArabic ? 'موقعك الحالي' : 'Your Location'}</p>
                                <p className="font-medium">{displayName}</p>
                            </div>
                        </div>
                    </GlassCardContent>
                </GlassCard>
            )}

            {/* Compass status / permission */}
            {!isSupported && (
                <GlassCard className="w-full">
                    <GlassCardContent className="p-4 pt-4">
                        <div className="flex items-center gap-3">
                            <LocateFixed className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {isArabic
                                        ? 'البوصلة غير متاحة على هذا الجهاز. يتم عرض اتجاه القبلة بزاوية ثابتة.'
                                        : 'Compass is not available on this device. Showing static Qibla bearing.'}
                                </p>
                            </div>
                        </div>
                    </GlassCardContent>
                </GlassCard>
            )}

            {isSupported && !hasPermission && (
                <Button onClick={requestPermission} className="w-full gap-2 h-14 rounded-2xl text-base">
                    <Compass className="w-5 h-5" />
                    {isArabic ? 'تفعيل البوصلة' : 'Enable Compass'}
                </Button>
            )}

            {isAligned && (
                <div className="flex items-center justify-center gap-2 text-center text-primary animate-fade-slide-in">
                    <CheckCircle2 className="h-5 w-5" />
                    <p className="font-semibold text-lg">
                        {isArabic ? 'أنت تواجه القبلة' : 'You are facing the Qibla'}
                    </p>
                </div>
            )}
        </div>
    );
}
