import os
from dotenv import load_dotenv
from fastapi.exceptions import RequestValidationError
from starlette.middleware import Middleware
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from application.modules.utils.connection import init_db, lifespan


class Application:
    def __init__(self, trusted_domains: list[str]):
        load_dotenv()

        self.__api_prefix: str = os.getenv("API_PREFIX", "/api/v1")
        self.__app: FastAPI = FastAPI(
            middleware=self._build_middleware(trusted_domains),
            title="CortexUI - API Docs",
            lifespan=lifespan,
            description="""
                Die CortexUI API ist ein modernes, modulares Admin-Backend für datengetriebene Webanwendungen. 
                Sie kombiniert leistungsstarke Analytics-Funktionen mit flexiblem Content-Management und sicherer Benutzerverwaltung – alles unter einem Dach.

                Vorteile der CortexUI API:
                
                ✅ Intuitive Struktur  
                Dank klarer Routen und durchdachter Modelle lässt sich die API einfach integrieren – egal ob für Frontend-Apps, automatisierte Services oder externe Tools.
                
                ⚡ Reaktiv & performant  
                Die API liefert schnellstmögliche Antworten durch eine skalierbare MongoDB-Datenstruktur mit asynchronem Zugriff via FastAPI & Beanie.
                
                🛠️ Vielseitiges Admin-Tool  
                Ob CMS-Posts, Rollenrechte, Kategorien oder globale Einstellungen – die API deckt alle zentralen Funktionen ab, die ein modernes Admin-Dashboard benötigt.
                
                📊 Analytics inklusive  
                CortexUI ist mit Matomo verbunden und stellt aggregierte Besuchs- und Nutzerstatistiken über eigene API-Endpunkte zur Verfügung.
                
                🧱 Rollenbasiert & sicher  
                Alle Routen sind mit JWT-Authentifizierung geschützt und unterstützen rollenbasierte Zugriffsrechte (Admin, Editor, Writer, Viewer).
                
                🚀 Moderne Architektur  
                Mit Technologien wie FastAPI, MongoDB, Beanie ODM und Next.js bietet CortexUI eine zukunftssichere Plattform für Headless Management und Analyse.
                
                Kurz gesagt:  
                CortexUI ist dein smartes Control Center für Inhalte, Nutzer und Insights – sicher, modular und Open Source. 🧠💻
            """,
            version=os.getenv("VERSION", "1.0.0"),
            contact={
                "name": "CortexUI by elbers.dev",
                "email": "merlin@elbers.dev",
            },
            swagger_ui_parameters={"defaultModelsExpandDepth": -1}
        )
        self.__init_routes()
        self.__init_handlers()

    @staticmethod
    def _build_middleware(trusted_domains: list[str]) -> list[Middleware]:
        return [
            Middleware(
                CORSMiddleware, # type: ignore[arg-type]
                allow_origins=trusted_domains,
                allow_credentials=True,
                allow_methods=["*"],
                allow_headers=["*"],
            )
        ]

    @property
    def app(self) -> FastAPI:
        return self.__app

    def __init_routes(self):
        from application.routers import auth, users, health

        routers = [
            (auth.router, "/auth"),
            (users.router, ""),
            (health.router, "/health"),
        ]

        for router, prefix in routers:
            self.__app.include_router(router, prefix=f"{self.__api_prefix or ''}{prefix}")


    def __init_handlers(self):
        from application.modules.schemas.response_schemas import GeneralException

        @self.__app.exception_handler(GeneralException)
        async def general_exception_handler(request: Request, exc: GeneralException):
            return JSONResponse(
                status_code=exc.status_code,
                content={
                    "isOk": exc.isOk,
                    "status": exc.status,
                    "message": exc.exception,
                    "requestedUrl": f"{request.url}"
                }
            )

        @self.__app.exception_handler(RequestValidationError)
        async def validation_exception_handler(request: Request, exc: RequestValidationError):
            for error in exc.errors():
                error['exception'] = error.pop('msg')
                error['errorType'] = error.pop('type')
                error['location'] = error.pop('loc')
                error.pop("url", None)
                error.pop("input", None)
            return JSONResponse(
                status_code=422,
                content={
                    "isOk": False,
                    "status": "VALIDATION_ERROR",
                    "message": exc.errors(),
                    "requestedUrl": str(request.url)
                }
            )
