import {JSX} from "react";

export interface MatomoSummaryItem {
    label: string;
    icon: string | null | JSX.Element;
    number: number;
    trend: string;
    trendLabel: string;
}

export interface MatomoTopPage {
    url: string;
    visitsLastWeek: number;
    averageTimeLastWeek: number;
    bounceRateLastWeek: number;
    exitRateLastWeek: number;
    averageLoadTimeLastWeek: number;
}

export interface MatomoTopReferrer {
    label: string;
    visitsLastWeek: number;
    actionsLastWeek: number;
    averageSessionLengthLastWeek: number;
    bounceRateLastWeek: number;
    icon: string | null | JSX.Element;
}

export interface MatomoTopCountry {
    country: string;
    visitsLastWeek: number;
    actionsLastWeek: number;
    averageSessionLengthLastWeek: number;
    bounceRateLastWeek: number;
}

export interface MatomoAnalytics {
    summary: MatomoSummaryItem[];
    topCountries: MatomoTopCountry[];
    topReferrers: MatomoTopReferrer[];
    topPages: MatomoTopPage[];
}
