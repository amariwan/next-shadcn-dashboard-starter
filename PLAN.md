# Implementierungsplan: Alle 5 Verbesserungsbereiche

## Status
- Erledigt: Auth-Fix, Orgs/Teams-Feature, Devcontainer, Dependency-Migration, grüner Build
- Offen: Alle 5 Bereiche aus der Ideenliste

---

## Phase 1: Architektonische Foundation (Jetzt)

| Aufgabe | Datei | Status |
|---------|-------|--------|
| Orgs Service Layer (Prisma abkapseln) | `src/features/organizations/api/service.ts` | Geplant |
| Orgs Zod Schemas (Validierung) | `src/features/organizations/schemas/` | Geplant |
| AuditLog Modell + Migration | `prisma/schema.prisma`, Migration | Geplant |
| Route Handler nutzen Service Layer | `src/app/api/organizations/*/route.ts` | Geplant |
| Type-safe Session-Erweiterung für AuditLog | `src/types/auth.ts` | Geplant |

## Phase 2: DevOps & Infrastruktur

| Aufgabe | Datei | Status |
|---------|-------|--------|
| GitHub Actions CI (lint, tsc, build, test) | `.github/workflows/ci.yml` | Geplant |
| Docker-Compose (Postgres + App) | `docker-compose.yml` | Geplant |
| Prisma auf Postgres umstellbar (Datenbank-Provider via ENV) | `prisma/schema.prisma` | Geplant |
| Standalone Docker Build testen | `Dockerfile` | Geplant |

## Phase 3: Quick Wins (Auth & UI)

| Aufgabe | Datei | Status |
|---------|-------|--------|
| Passwort vergessen / Reset Flow | `src/app/api/auth/forgot-password/route.ts`, `reset-password` Seite | Geplant |
| E-Mail-Verifizierung | `VerificationToken` nutzbar machen | Geplant |
| Profil bearbeiten (`/dashboard/profile`) | Bestehende Seite vervollständigen | Geplant |
| Toast/Notifications System | `sonner` oder shadcn Toaster | Geplant |

## Phase 4: Mittelfristige Features

| Aufgabe | Datei | Status |
|---------|-------|--------|
| Aktivitäts-Log (AuditLog UI) | `/dashboard/audit-log` | Geplant |
| Org-Einstellungen & Plan-Limit | Mitglieder-Limit, Plan-Feld | Geplant |
| Echte Invitation-E-Mails (Resend) | E-Mail-Provider anbinden | Geplant |

## Phase 5: UX / Polish

| Aufgabe | Datei | Status |
|---------|-------|--------|
| Skeleton-Screens für Orgs | Bestehende Skeletts erweitern | Geplant |
| Tastatur-Shortcuts verkabeln | `nav-config.ts` shortcuts → Aktion | Geplant |
| Bestätigungs-Dialogs (Delete/Leave) | Bereits teilweise vorhanden, vervollständigen | Geplant |
| Empty States | `Empty` Komponente | Geplant |

---

## Wie weiter?
Wir arbeiten die Phasen nacheinander ab. Phase 1 (Foundation) kommt zuerst, weil alles andere darauf aufbaut.
