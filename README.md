# CortexUI – The Modular Open Source Admin Dashboard

**CortexUI** ist ein hochmodernes, modulares Admin-Backend für datengetriebene Webanwendungen. 
Es kombiniert leistungsstarke Analytics, rollenbasiertes User Management, Content-Management und SMTP- und Microsoft365 Integration in einem leicht erweiterbaren Headless-System. Voll Open Source. Voller Fokus auf Developer Experience.

---

<p align="center">
  <img src="/assets/CortexUI.png" width="735" alt="CortexUI Logo" />
</p>

<p align="center">
  <b>FastAPI ✨ MongoDB ✨ Beanie ✨ Next.js ✨ TailwindCSS</b><br>
  <i>Modular. Sicher. Extensible.</i>
</p>

---

## 🚀 Features

* 🔐 **JWT-Auth** mit rollenbasierter Zugriffskontrolle (Admin, Editor, Viewer)
* 📊 **Analytics-Integration** via Matomo
* 🧱 **CMS-Funktionen** für Seiten, Kategorien & Content-Elemente
* 📨 **Mail-Konfiguration** via SMTP oder Microsoft365 (verschlüsselt)
* 👥 **User-Management** mit Login-Historie
* ⚙️ **Setup-Wizard** (inkl. Datei-Upload & Konfigurationsimport)
* 🧩 **Modularer Codeaufbau** für eigene Erweiterungen

---

## 🧰 Tech Stack

| Backend | Frontend             | Datenbank        | Auth | Deployment                   |
| ------- | -------------------- | ---------------- | ---- | ---------------------------- |
| FastAPI | Next.js (App Router) | MongoDB + Beanie | JWT  | Docker / Vercel / Bare Metal |

---

## 📦 Getting Started

### 1. Projekt clonen

```bash
git clone https://github.com/merlin-elbers/cortex-ui.git
cd cortex-ui
```

### 2. Frontend vorbereiten

```bash
cp .env.example .env
npm install
```

### 3. Backend vorbereiten

```bash
cd api
pip install -r requirements.txt
uvicorn application:Application.app --host 127.0.0.1 --port 8000 # oder python run.py
```

### 4. Frontend starten

```bash
cd ..
npm run build
npm run start # oder npm run dev
```

---

## 🛠 Setup Modes

* **Guided Setup**: per UI Schritt-für-Schritt inklusive Validierungen
* **Config Import**: lade direkt eine vorher exportierte `config.json` hoch

---

## 🧪 Beispiel-Konfiguration (`config.json`)

```json
{
  "database": {
    "uri": "mongodb://localhost:27017",
    "dbName": "cortex-ui"
  },
  "adminUser": {
    "email": "admin@cortex.ui",
    "password": "securepass123",
    "firstName": "Cortex",
    "lastName": "Admin"
  },
  "mailServer": {
    "type": "smtp",
    "smtp": {
      "host": "smtp.cortex.ui",
      "port": 587,
      "username": "no-reply@cortex.ui",
      "password": "securepass123",
      "senderEmail": "no-reply@cortex.ui",
      "senderName": "CortexUI System",
      "tested": true
    }
  },
  "analytics": {
    "connectionTested": true,
    "matomoUrl": "https://analytics.cortex.ui",
    "matomoSiteId": "1",
    "matomoApiKey": "xyz123abc"
  },
  "license": {
    "accepted": true
  },
  "selfSignup": {
    "enabled": false
  },
  "generatedAt": "2025-07-20T20:00:00.000Z",
  "version": "1.0.0"
}
```

---

## 📸 Screenshots

> *(hier kannst du fancy UI Screens oder Gifs reinpacken)*

---

## 🛡 Lizenz

CortexUI steht unter der **Apache License 2.0**.
Du kannst es frei verwenden, erweitern und auch kommerziell einsetzen.

Mehr dazu in der [LICENSE](./LICENSE).

---

## 🤝 Mitwirken

Pull Requests sind willkommen! Bitte lies zuerst die [CONTRIBUTING.md](./CONTRIBUTING.md), bevor du loslegst.

---

## 💡 Roadmap

* [ ] Webhook-Support
* [ ] Dark Mode Frontend
* [ ] Exportierbare Analytics-Daten
* [ ] Mehrsprachige Inhalte (DE/EN/FR)
* [ ] Theme-System für CMS

---

## 🧠 Von Entwicklern, für Entwickler

Dieses Projekt wurde mit Liebe gebaut von [Merlin Elbers](https://www.elbers.dev) ✨

