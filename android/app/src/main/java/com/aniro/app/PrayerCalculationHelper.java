package com.aniro.app;

import com.batoulapps.adhan.CalculationMethod;
import com.batoulapps.adhan.CalculationParameters;
import com.batoulapps.adhan.PrayerAdjustments;

final class PrayerCalculationHelper {
    private PrayerCalculationHelper() {
    }

    static CalculationParameters getCalculationParameters(String method) {
        switch (method) {
            case "egyptian":
                return CalculationMethod.EGYPTIAN.getParameters();
            case "karachi":
                return CalculationMethod.KARACHI.getParameters();
            case "umm_al_qura":
                return CalculationMethod.UMM_AL_QURA.getParameters();
            case "dubai":
                return CalculationMethod.DUBAI.getParameters();
            case "qatar":
                return CalculationMethod.QATAR.getParameters();
            case "kuwait":
                return CalculationMethod.KUWAIT.getParameters();
            case "moonsighting_committee":
                return CalculationMethod.MOON_SIGHTING_COMMITTEE.getParameters();
            case "singapore":
                return CalculationMethod.SINGAPORE.getParameters();
            case "north_america":
                return CalculationMethod.NORTH_AMERICA.getParameters();
            case "turkey":
                return new CalculationParameters(18.0, 17.0, CalculationMethod.OTHER)
                        .withMethodAdjustments(new PrayerAdjustments(0, -7, 5, 4, 7, 0));
            case "tehran":
                return new CalculationParameters(17.7, 14.0, CalculationMethod.OTHER);
            case "other":
                return CalculationMethod.OTHER.getParameters();
            case "muslim_world_league":
            default:
                return CalculationMethod.MUSLIM_WORLD_LEAGUE.getParameters();
        }
    }
}
