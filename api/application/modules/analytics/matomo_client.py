import requests
from typing import Optional, Dict, Any


class MatomoAPIClient:
    def __init__(self, base_url: str, site_id: int, encrypted_token: str):
        """
        :param site_id: ID der Matomo Site
        :param base_url: z.B. https://analytics.cortex.ui/index.php
        :param encrypted_token: verschlüsselter Token aus der Datenbank
        """
        self._site_id = site_id
        self._base_url = base_url
        self.__encrypted_token = encrypted_token
        self.token_auth = self._get_token()

    @property
    def site_id(self):
        return self._site_id

    @site_id.setter
    def site_id(self, site_id: int):
        self._site_id = site_id

    @property
    def base_url(self):
        return self._base_url

    @base_url.setter
    def base_url(self, base_url: str):
        self._base_url = base_url

    def _get_token(self) -> str:
        from application.modules.utils.crypto import decrypt_password
        return decrypt_password(self.__encrypted_token)

    def _request(self, method: str, extra_params: Optional[Dict[str, Any]] = None) -> Dict:
        """
            POST-Anfrage an die Matomo API mit form-url-encoded Body
        """
        data = {
            "module": "API",
            "method": method,
            "idSite": self.site_id,
            "token_auth": self.token_auth,
            "format": "JSON"
        }

        if extra_params:
            data.update(extra_params)

        headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }

        response = requests.post(self.base_url, data=data, headers=headers)
        response.raise_for_status()
        return response.json()

    def get_summary(self, period="day", date="today"):
        return self._request("VisitsSummary.get", {
            "period": period,
            "date": date
        })

    def get_visits_time_series(self, days=14):
        return self._request("VisitsSummary.getVisits", {
            "period": "day",
            "date": f"last{days}"
        })

    def get_live_visits(self, limit=10):
        return self._request("Live.getLastVisitsDetails", {
            "filter_limit": limit
        })

    def get_top_pages(self, period="week", date="today"):
        return self._request("Actions.getPageUrls", {
            "period": period,
            "date": date
        })

    def get_top_referrers(self, period="month", date="today"):
        return self._request("Referrers.getReferrerType", {
            "period": period,
            "date": date
        })

    def get_countries(self, period="month", date="today"):
        return self._request("UserCountry.getCountry", {
            "period": period,
            "date": date
        })
