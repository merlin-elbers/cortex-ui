from fastapi import APIRouter, Depends
from application.modules.analytics.matomo_client import MatomoAPIClient
from application.modules.analytics.matomo_extractor import calculate_difference, get_two_week_windows, \
    extract_top_pages, extract_top_referrers, extract_top_countries
from application.modules.database.database_models import MatomoConfig
from application.modules.schemas.response_schemas import ValidationError, GeneralExceptionSchema, \
    GeneralException, MatomoAnalyticsResponse
from application.modules.schemas.schemas import MatomoAnalytics, MatomoSummary
from application.routers.auth.utils import get_current_user

router = APIRouter()


@router.get("/analytics/matomo",
            status_code=200,
            tags=["📊 Analytics"],
            name="Erhalte Matomo Analytics Daten",
            description="""
                Ruft aktuelle Analytics-Daten von Matomo ab, z.B. Besucherzahlen, Seitenaufrufe,
                Live-Besucher, Top-Seiten und Referrer.

                Die Daten werden über die Matomo Reporting API bezogen, der API-Key muss zuvor in der Konfiguration
                des Systems hinterlegt worden sein.

                ✅ Nützlich für:
                - Dashboards im Admin-Bereich von CortexUI
                - Monitoring des Nutzerverhaltens auf der Plattform
                - Anzeige von Besucherstatistiken in Echtzeit
                - Überblick über beliebte Inhalte & Traffic-Quellen

                🔐 **Erfordert gültigen Login-Token** (JWT im Header)
            """,
            response_description="Matomo Analytics Daten aggregiert für das Dashboard",
            responses={
                200: {
                    'description': 'Analytics-Daten erfolgreich geladen',
                    'model': MatomoAnalyticsResponse
                },
                401: {
                    'description': 'Nicht autorisiert – fehlender oder ungültiger Token',
                    'model': GeneralExceptionSchema
                },
                422: {
                    'description': 'Fehlerhafte Anfrageparameter',
                    'model': ValidationError
                },
                500: {
                    'description': 'Interner Fehler bei der Abfrage oder Entschlüsselung des Matomo API-Tokens',
                    'model': GeneralExceptionSchema
                }
            })
async def get_matomo_analytics():
    matomo_data = await MatomoConfig.find_one()
    if not matomo_data:
        raise GeneralException(
            is_ok=False,
            exception="Keine Matomo Konfiguration gefunden",
            status="NOT_FOUND",
            status_code=404,
        )
    matomo_client = MatomoAPIClient(
        base_url=matomo_data.matomoUrl,
        site_id=matomo_data.matomoSiteId,
        encrypted_token=matomo_data.matomoApiKey
    )
    current_range, previous_range = get_two_week_windows()

    last_week = matomo_client.get_summary(period="range", date=current_range)
    previous_week = matomo_client.get_summary(period="range", date=previous_range)

    return MatomoAnalyticsResponse(
        isOk=True,
        status="OK",
        message="Daten von Matomo erfolgreich evaluiert",
        data=MatomoAnalytics(
            summary=MatomoSummary(
                visitsLastWeek=last_week.get('nb_visits'),
                visitsPreviousWeek=previous_week.get('nb_visits'),
                visitsDifference=calculate_difference(
                    last_week.get('nb_visits'), previous_week.get('nb_visits')
                ),
                bounceCountLastWeek=last_week.get('bounce_count'),
                bounceCountPreviousWeek=previous_week.get('bounce_count'),
                bounceCountDifference=calculate_difference(
                    last_week.get('bounce_count'), previous_week.get('bounce_count')
                ),
                averageTimeLastWeek=last_week.get('avg_time_on_site'),
                averageTimePreviousWeek=previous_week.get('avg_time_on_site'),
                averageTimeDifference=calculate_difference(
                    last_week.get('avg_time_on_site'), previous_week.get('avg_time_on_site')
                ),
                actionsLastWeek=last_week.get('nb_actions'),
                actionsPreviousWeek=previous_week.get('nb_actions'),
                actionsDifference=calculate_difference(
                    last_week.get('nb_actions'), previous_week.get('nb_actions')
                )
            ),
            topCountries=extract_top_countries(matomo_client.get_countries(period="week", date="last1")),
            topReferrers=extract_top_referrers(matomo_client.get_top_referrers(period="week", date="last1")),
            topPages=extract_top_pages(matomo_client.get_top_pages(period="week", date="last1"))
        )
    )
