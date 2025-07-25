# 🤝 Beitrag zu CortexUI

Vielen Dank, dass du dich für eine Beteiligung an **CortexUI** interessierst! Dieses Dokument erklärt, wie du zum Projekt beitragen kannst.

## 📘 Projektüberblick

**CortexUI** ist ein hochmodernes, modulares Admin-Backend für datengetriebene Webanwendungen. Es kombiniert:

- 🔐 Rollenbasiertes User-Management
- 🧠 Analytics mit Matomo
- 🗂 Content-Management
- 📧 SMTP- & Microsoft 365 Integration
- ⚙️ Headless & API-first Architektur
- 🧩 Erweiterbar und voll Open Source

## 🧑‍💻 Tech-Stack

- **Frontend:** Next.js v15+ mit App Router, TailwindCSS v4+, TypeScript, Zod, Lucide-React, Radix UI
- **Backend:** FastAPI v0.115, Beanie, Pydantic, Motor
- **Datenbank:** MongoDB 8.0.9 Community
- **Tooling:** ESLint, PyCharm (Linting)

## 🚀 Projektstruktur

### Frontend (`/app`)
- `/components` – UI Komponenten
- `/context` – Globale Context-Provider (z. B. Auth)
- `/hooks` – Reusable React Hooks
- `/lib` – Utilities & Helpers
- `/assets` – Globale Assets wie Logos
- `/types` – Interfaces und Zod-Schemas

### Backend (`/api`)
- `/application/modules` – Logik & Services
- `/application/routers` – API-Routen nach Kontext getrennt (`/system`, `/auth`, …)
- `.env` wird beim ersten Start automatisch generiert

## 🛠 Lokale Entwicklung

```bash
# Frontend starten
cd app
npm install
npm run dev

# Backend starten
cd api
python run.py
```

> Eine `.env.example` liegt dem Frontend bei.  
> Die API erstellt ihre `.env` automatisch beim ersten Start.  

## 📦 Tests

Derzeit keine automatisierten Tests. Bitte Features testbar einreichen.  
In Zukunft sollen Tests eingeführt werden (z. B. mit `pytest`, `playwright`, etc.).

## ✅ Commit Konvention (empfohlen)

Nutze Conventional Commits für bessere Lesbarkeit:


| Prefix    | Zweck                         |
|-----------|-------------------------------|
| feature:  | Neues Feature                 |
| bugfix:   | Bugfix                        |
| chore:    | Build, CI, etc                |
| docs:     | Dokumentation                 |
| refactor: | Codeverbesserung ohne Bugfix  |
| style:    | Formatierung, Semikolons, etc |

Beispiel: feature: add setup wizard for Microsoft 365 auth

## 🧭 Beitragsschritte

1. Forke das Repo
2. Erstelle einen Branch: `feature/dein-feature`
3. Füge Änderungen hinzu & committe
4. Stelle einen Pull Request (PR)
5. Diskutiere Feedback → merge

### Bitte beachte

- Kein direktes Pushen auf `main`
- **Keine Breaking Changes an der Datenbankstruktur ohne Absprache**
- PRs zu größeren Features vorher in einem Issue oder Projektboard abklären

## 🧩 GitHub Issues & Labels

### Labels
Nutze die Standard-Labels:
- `bug`, `enhancement`, `documentation`, `help wanted`, `question`

### Template-Vorschlag
```md
### 🐞 Problem
_Beschreibe den Fehler oder Verbesserungsvorschlag._

### ✅ Erwartetes Verhalten
_Wie sollte es idealerweise funktionieren?_

### 🧪 Schritte zur Reproduktion
1. ...
2. ...

### 💡 Vorschlag zur Lösung
_Wenn du eine Idee hast, wie man es lösen könnte, hier rein._
```

## 📜 Lizenzhinweis

Die Nutzung von CortexUI erfolgt unter der Apache 2.0 Lizenz.  
Mit dem Beitrag bestätigst du, dass du mit der Lizenzvereinbarung einverstanden bist.