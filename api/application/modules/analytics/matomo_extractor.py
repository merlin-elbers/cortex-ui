from typing import List, Dict, Tuple
from datetime import date, timedelta

from application.modules.analytics.matomo_client import MatomoAPIClient
from application.modules.schemas.schemas import MatomoTopPage, MatomoTopReferrer, MatomoTopCountry, MatomoSummaryItem


def parse_bounce_rate(bounce_count: int, page_visits: int) -> float:
    return round((bounce_count / page_visits * 100), 2) if page_visits > 0 else 0.0


def calculate_difference(last_week_data: int, previous_week_data: int) -> float:
    difference = (last_week_data - previous_week_data)
    return round(
        ((difference / previous_week_data * 100) if previous_week_data != 0 else 0),
        2
    )


def extract_summary(matomo_client: MatomoAPIClient) -> List[MatomoSummaryItem]:
    current_range, previous_range = get_two_week_windows()

    last_week = matomo_client.get_summary(period="range", date=current_range)
    previous_week = matomo_client.get_summary(period="range", date=previous_range)

    return [
        MatomoSummaryItem(
            label="Aufrufe",
            icon=None,
            number=last_week.get('nb_visits'),
            trend="UP" if calculate_difference(last_week.get('nb_visits'),
                                               previous_week.get('nb_visits')) > 0 else "DOWN",
            trendLabel=f"{calculate_difference(last_week.get('nb_visits'), previous_week.get('nb_visits'))}%"
        ),
        MatomoSummaryItem(
            label="Bounce Rate",
            icon=None,
            number=last_week.get('bounce_count'),
            trend="UP" if calculate_difference(last_week.get('bounce_count'),
                                               previous_week.get('bounce_count')) else "DOWN",
            trendLabel=f"{calculate_difference(last_week.get('bounce_count'), previous_week.get('bounce_count'))}%"
        ),
        MatomoSummaryItem(
            label="Interaktionen",
            icon=None,
            number=last_week.get('nb_actions'),
            trend="UP" if calculate_difference(last_week.get('nb_actions'),
                                               previous_week.get('nb_actions')) > 0 else "DOWN",
            trendLabel=f"{calculate_difference(last_week.get('nb_actions'), previous_week.get('nb_actions'))}%"
        ),
        MatomoSummaryItem(
            label="Ø Zeit auf Seite",
            icon=None,
            number=last_week.get('avg_time_on_site'),
            trend="UP" if calculate_difference(last_week.get('avg_time_on_site'),
                                               previous_week.get('avg_time_on_site')) > 0 else "DOWN",
            trendLabel=f"{calculate_difference(last_week.get('avg_time_on_site'), 
                                               previous_week.get('avg_time_on_site'))}%"
        ),
    ]


def get_two_week_windows(today: date = date.today()) -> Tuple[str, str]:
    """
    Gibt zwei Zeiträume im Matomo-Format zurück:
    - Aktuelle Woche (letzte 7 Tage inkl. heute)
    - Vorherige Woche (die 7 Tage davor)

    :return: (current_week_range, previous_week_range)
             z.B. ("2025-07-20,2025-07-26", "2025-07-13,2025-07-19")
    """
    end_current = today
    start_current = end_current - timedelta(days=6)

    end_previous = start_current - timedelta(days=1)
    start_previous = end_previous - timedelta(days=6)

    current_range = f"{start_current.isoformat()},{end_current.isoformat()}"
    previous_range = f"{start_previous.isoformat()},{end_previous.isoformat()}"

    return current_range, previous_range


def parse_percent(value: str) -> float:
    try:
        return float(value.strip('%'))
    except (ValueError, TypeError):
        return 0.0


def extract_top_pages(data: Dict[str, List[Dict[str, any]]], limit: int = 5) -> List[MatomoTopPage]:
    """
    Wandelt die Matomo-Top-Seiten-Daten in ein lesbares Schema um.

    :param data: Rohdaten von `Actions.getPageUrls` für Zeitraum `last7`
    :param limit: Anzahl der Top-Seiten (default: 5)
    :return: Liste von Seiten-Dictionaries
    """
    if not data:
        return []

    top_pages: List[MatomoTopPage] = []

    for page in sorted(data.get(next(iter(data)), []), key=lambda p: p.get("nb_visits", 0), reverse=True)[:limit]:
        top_pages.append(MatomoTopPage(
            url=page.get("label", "unknown"),
            visitsLastWeek=page.get("nb_visits", 0),
            averageTimeLastWeek=round(page.get("avg_time_on_page", 0)),
            bounceRateLastWeek=round(parse_percent(page.get("bounce_rate", "0%")), 2),
            exitRateLastWeek=round(parse_percent(page.get("exit_rate", "0%")), 2),
            averageLoadTimeLastWeek=round(page.get("avg_page_load_time", 0.0), 2)
        ))
    return top_pages


def extract_top_referrers(data: Dict[str, List[Dict[str, any]]], limit: int = 5) -> List[MatomoTopReferrer]:
    """
    Extrahiert die Top-Referrer aus einer Matomo-Antwort mit dynamischem Datumskey.

    :param data: Matomo Referrer-Daten z.B. {"2025-07-21,2025-07-27": [...]}
    :param limit: Maximalanzahl an Referrern
    :return: Liste strukturierter Referrer-Objekte
    """
    if not data:
        return []

    top_referrers: List[MatomoTopReferrer] = []

    for ref in sorted(data.get(next(iter(data)), []), key=lambda r: r.get("nb_visits", 0), reverse=True)[:limit]:

        top_referrers.append(MatomoTopReferrer(
            label=ref.get('label', 'unknown'),
            visitsLastWeek=ref.get("nb_visits", 0),
            actionsLastWeek=ref.get("nb_actions", 0),
            averageSessionLengthLastWeek=round(
                ref.get("sum_visit_length", 0) / ref.get("nb_visits", 0)
            ) if ref.get("nb_visits", 0) > 0 else 0,
            bounceRateLastWeek=parse_bounce_rate(ref.get("bounce_count", 0), ref.get("nb_visits", 0)),
        ))

    return top_referrers


def extract_top_countries(data: Dict[str, List[Dict[str, any]]], limit: int = 5) -> List[MatomoTopCountry]:
    """
    Extrahiert die Top-Länder aus einer Matomo-Antwort mit dynamischem Zeit-Index.

    :param data: Matomo-Daten wie {"2025-07-21,2025-07-27": [...]}
    :param limit: Anzahl der Top-Länder (default: 5)
    :return: Liste strukturierter Länderinfos
    """
    if not data:
        return []

    top_countries: List[MatomoTopCountry] = []

    for country in sorted(data.get(next(iter(data)), []), key=lambda c: c.get("nb_visits", 0), reverse=True)[:limit]:
        top_countries.append(MatomoTopCountry(
            country=country.get("label", "Unknown"),
            visitsLastWeek=country.get("nb_visits", 0),
            actionsLastWeek=country.get("nb_actions", 0),
            averageSessionLengthLastWeek=round(
                country.get("sum_visit_length", 0) / country.get("nb_visits", 0)
            ) if country.get("nb_visits", 0) > 0 else 0,
            bounceRateLastWeek=parse_bounce_rate(country.get("bounce_count", 0), country.get("nb_visits", 0))
        ))

    return top_countries
