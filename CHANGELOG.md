# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2025-08-01
### Added
- Full backup system with scheduler control and admin-only routes
- Manual backup trigger via `/backup/start` and job control endpoints
- Secure backup file download and deletion via API
- Email verification flow with HTML templates, SMTP/M365 support and token refresh
- Support for base64 logo embedding in emails
- New `externalUrl` setting used throughout backend and frontend
- Responsive verify page and updated AuthContext

### Changed
- Improved error handling in backup runner and scheduler module
- Added OpenAPI docs to all new system and settings routes
- Setup now uses `.env` instead of Next.js public envs

---

## [1.1.0] - 2025-07-25
### Added
- Full settings management (Mail, Analytics, Database, Backup, General)
- Dynamic `fetchWithAuth` for secure token handling
- `DatabaseHealth` component with live status
- Zod validation and deep merge protection on config upload
- Improved setup UX with warnings and safer data merging
- Skeleton loaders and top country charts in dashboard
- Matomo analytics integration (API client, schema, token decryption)

### Changed
- Refactored route structure: `system -> settings`
- Improved login UX with suspense fallback and redirect fix
- Updated schema definitions and TypeScript interfaces

---

## [1.0.0] - 2025-07-14
### Added
- Fully functional setup wizard (backend + frontend)
- Role-based access control (RBAC)
- Public health checks and ping routes
- File upload system with preview + cleanup
- Initial theming and whitelabel logic
- AuthContext improvements and server status
- 404 page with style
- CONTRIBUTING.md and example config
- Notification system and login health checks

### Fixed
- Various import and validation bugs (Pydantic, Suspense, metadata)
- Spam clicking, early setup flag, missing keys, loop issues

### Changed
- Cleaned up unused logs, old Vercel files and default types
- Improved modular folder structure for API and UI

---

## [0.1.0] - 2025-07-01
### Initial
- Project scaffolded via Next.js and FastAPI
- Initial RBAC, user routes, crypto utilities, and login flow
- API initialization with database connection
