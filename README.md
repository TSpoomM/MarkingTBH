# MarkingTBH

Web app for creating and printing export **marking stickers** (in-frame, out-of-frame, customer-name and FSC-logo stickers) from per-customer templates. Every save or print is recorded, and admins manage templates, destinations and other admins.

The application lives in [`my-app/`](my-app/). UI text is Thai; code and comments are English.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · MySQL (`mysql2`) · zod · Vitest

## Quick start

Requirements: Node.js 20+, Yarn, a MySQL database (XAMPP is fine locally).

```bash
cd my-app
yarn install
cp .env.example .env      # then fill in the DB_* values, see "Configuration"
yarn dev                  # http://localhost:3000
```

| Command | What it does |
|---|---|
| `yarn dev` | Development server |
| `yarn build` / `yarn start` | Production build / server |
| `yarn lint` | ESLint |
| `yarn test` | Unit tests (Vitest, no database needed) |
| `npx tsc --noEmit` | Type check |

To try the app without logging in, set `DEV_AUTH_BYPASS=true` in `.env` (works only when `NODE_ENV=development`).

## Configuration

All settings are environment variables; [`my-app/.env.example`](my-app/.env.example) documents each one.

| Variable | Needed | Purpose |
|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_NAME` | always | MySQL connection. `DB_PASSWORD` may be empty. |
| `AUTH_SESSION_SECRET` | production | Signs the login cookie. |
| `ADMIN_USER_IDS` | optional | Employee ids that are always admins. |
| `NEXT_PUBLIC_BASE_PATH` | optional | URL prefix. Defaults to `/markingsticker` in production, none in development. |
| `PHP_SESSION_*` | optional | Single sign-on from the HRKPIs portal (reads its PHP session files). |
| `DEV_AUTH_BYPASS`, `DEV_AUTH_EMP_ID` | dev only | Skip login. Never set on a server. |

On startup the server checks the database settings and `AUTH_SESSION_SECRET` (`src/instrumentation.ts`). In development it prints what is missing; in production it refuses to start.

Tables used: `tb_template`, `tb_marking`, `tb_destination`, `tb_admin`, `tb_employee_list`, `tb_action_log`, `db_tbh_user`.

## Sign-in and roles

There are two ways in, and both end in the same session check (`/api/session`):

1. **App login** – username and password checked against `db_tbh_user` (SHA-1 hash). Sets a signed `app_session` cookie. The session ends after **30 minutes without activity**: the expiry is stored inside the signed cookie and checked on the server, and it is pushed 30 minutes ahead each time the browser asks `/api/session`. `AppShell` does that on every page change and, while the user is clicking or typing, at most once every 2 minutes (`core/session/activityThrottle.ts`). Typing in a form that never calls the server therefore does not expire the session as long as the user keeps interacting.
2. **HRKPIs single sign-on** – if the user already has a PHP session from the HRKPIs portal, it is read from the PHP session file.

Roles: `user` (marking only), `admin` (history, templates, destinations) and `super_admin` (also manages admins). Roles come from `tb_admin`; ids listed in `ADMIN_USER_IDS` count as `admin` even without a row. Pages are gated by `src/proxy.ts`, which only checks that a session cookie exists. It does not cover `/api`, so each API route checks the caller itself (`lib/server/adminAuth`, `requestCurrentUser`). Do the same in any new route.

## How the code is organised

Every page follows one layering. Data flows down on a request and back up as props:

```
Browser                                               Server
app/<page>/page.tsx                                   app/api/<name>/route.ts
  └ components/*        draws props, no fetching        └ core/services/server/*   validation, rules, action log
  └ core/controllers/*  holds page state, handles      └ core/repositories/*      SQL only
                        clicks
  └ core/services/client/*  calls the API ── HTTP ──►  lib/server/*                database, sessions, admin check
```

| Folder (under `my-app/src`) | Role |
|---|---|
| `app/` | Pages and API routes (Next.js file-based routing). A page is a thin `StoreContainer` that passes state to components. `api/*/route.ts` checks permission, calls a server service and turns the result into an HTTP response. |
| `components/` | Presentational React components, grouped by page. `ui/` holds shared building blocks (Button, Modal, Input, Navbar). Components receive props and never fetch. |
| `core/controllers/` | One controller per page. Extends `core/store/Store`, owns that page's state and async actions. |
| `core/services/client/` | Browser-side API calls. **All** HTTP goes through `http.service.ts` (adds the base path, unwraps `{ data, message }`). |
| `core/services/server/` | Server-side use cases: validate input with zod, call repositories, write the action log. |
| `core/repositories/` | SQL. One class per table area. |
| `core/models/` | Types and constants shared by both sides. |
| `core/stickers/`, `core/marking/`, `core/templates/`, `core/history/`, `core/dates/` | Pure business logic (no React, no I/O): building stickers, row rules, template parsing and draft editing, history filters, date formats. This is where most tests live. |
| `core/validation/` | Shared zod request schemas. |
| `core/ui/` | Named Tailwind class strings (not components). |
| `core/errors/` | `UserFacingError`, see conventions. |
| `lib/server/` | Server infrastructure: DB pool, session cookies, admin checks, action logger, env checks. |
| `styles/` | Global CSS and print CSS for the sticker sheet. |

### Example: an admin adds a destination

1. `components/destinations/DestinationForm` calls `onSubmit`.
2. `core/controllers/destinations.controller` checks the value is not empty and calls the client service.
3. `core/services/client/destination-api.service` sends `POST /api/destinations`.
4. `app/api/destinations/route.ts` confirms the caller is an admin.
5. `core/services/server/destination.service` validates with zod, calls the repository and writes the log entry.
6. `core/repositories/destination.repository` runs the SQL.

## Conventions

- **Components stay presentational.** State lives in a controller; a page extends `StoreContainer` and is the only subscriber.
- **No `fetch()` outside `core/services/client/http.service.ts`.** Never in a component or controller.
- **Routes never call repositories.** They go through a server service.
- **Client code must not import `lib/server`, `core/services/server` or `core/repositories`.**
- **Error messages:** throw `UserFacingError` for messages meant for the user (duplicate name, not found). Any other error is logged and the client only gets a generic message, so SQL or file details are never leaked. Routes use `clientMessage()` from `lib/server/apiError.ts`.
- **Put logic in pure classes** under `core/*` and unit-test it; keep controllers and services thin.
- Comments are in English.

## Adding a page

1. Model: types and state in `core/models/<name>.ts`.
2. Server side (if it needs data): repository → server service → `app/api/<name>/route.ts`.
3. Client service in `core/services/client/<name>-api.service.ts`.
4. Controller in `core/controllers/<name>.controller.ts` extending `Store`; export a singleton.
5. Presentational components in `components/<name>/`.
6. Page in `app/<name>/page.tsx` extending `StoreContainer`.
7. Add the page to `pageNavbarConfig` in `app/appShell.tsx`, to the menu list in `components/ui/Navbar.tsx` and to the `activeNav` type in `core/models/ui.ts`. If it needs a role, check it in the controller (for the UI) and in the API route (for real).
8. Tests for any pure logic and for the service and controller.

`Store.initialize()` runs `load()` on the first visit and `refresh()` (does nothing by default) on later visits. Override `refresh()` if the page must reload each time it opens, as the admins and destinations pages do.

## Testing

`yarn test` runs everything in a second or two and needs no database. Tests sit next to the code as `*.test.ts`; shared sample data is in `src/core/test/fixtures.ts`. Server services are tested with fake repositories passed to their constructors.

Not covered by automated tests: the repositories (they need a real database) and the React components. Check those by hand after changing them.

## Notes

- In development React Strict Mode mounts each page twice, so pages that reload on open may fetch twice. This does not happen in production.
- Print output depends on `styles/sticker-print.css` and the sticker sizing in `core/stickers/`. Check the print preview after touching either.
