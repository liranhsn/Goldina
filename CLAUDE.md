# Goldina — Claude Code Guide

## Project Overview

Desktop inventory management app for tracking gold, silver, accessories, checks, and fixed expenses. Built with Electron + React + TypeScript, localized in Hebrew (RTL).

## Tech Stack

- **Electron** 30 — desktop shell, main process, IPC
- **React** 18 + **TypeScript** 5 — renderer UI
- **Vite** / **electron-vite** — bundler
- **better-sqlite3** — native SQLite (main process only)
- **Vitest** — testing

## Commands

```bash
npm install          # install deps (runs postinstall/native rebuild automatically)
npm run dev          # start dev server with hot reload
npm run build:mac    # package for macOS
npm run build:win    # package for Windows (run on Windows or CI)
npm test             # run Vitest suite
```

## Architecture

Three-layer Electron architecture with strict process isolation:

```
Renderer (React)
  ↕  window.api.*
Preload (contextBridge)
  ↕  IPC (invoke/handle)
Main Process (business logic + SQLite)
```

- **`electron/main/index.ts`** — all IPC handlers
- **`electron/main/db.ts`** — SQLite schema, migrations, CRUD (single `db` singleton)
- **`electron/main/domain.ts`** — validation functions (keep business rules here)
- **`electron/preload/index.ts`** — exposes `window.api` to renderer; only add entries here when adding new IPC channels
- **`src/renderer/views/`** — one file per page/feature
- **`src/renderer/components/`** — shared UI (Modal, Field, DateRangeBar)
- **`src/types/preload.d.ts`** — TypeScript types for `window.api`

## Data Layer

- DB path: `~/.config/Goldina/data.db` (via Electron `userData`)
- WAL mode enabled, foreign keys on
- Migrations run automatically on startup in `db.ts`
- Metal types: `1` = gold, `2` = silver
- Check statuses: `1`=issued, `2`=deposited, `3`=returned, `4`=cancelled

## Key Conventions

- **Validation belongs in `domain.ts`** (main process), never in the renderer
- **IPC channel names** follow `resource:action` pattern (e.g., `metal:add`, `checks:update-status`)
- **Snake_case** in DB columns; camelCase in TypeScript
- **Hebrew UI** — all user-facing strings and error messages are in Hebrew
- **Currency** — always format with `formatILS()` from `src/renderer/utils/utils.ts`
- **Admin-only views** (HomeDashboard, Checks, FixedExpenses) are gated behind `admin:unlock` IPC call; admin state lives in `sessionStorage`

## Testing

Tests live in `tests/`. Two files:
- `domain.spec.ts` — pure validation unit tests
- `integration.spec.ts` — in-memory SQLite integration tests

Use an in-memory SQLite db (`new Database(':memory:')`) for integration tests — do not use the real `db` singleton.

## Native Module Notes

`better-sqlite3` is a native Node addon. It must:
- Be rebuilt for the current Electron version (`npm run postinstall` handles this)
- Be listed under `externals` in `electron.vite.config.ts`
- Be unpacked from ASAR in `electron-builder` config

When adding other native modules, follow the same pattern.

## Security Notes

- Context isolation is **on**; node integration is **off** in renderer — keep it that way
- The admin password is currently hardcoded to `"2468"` in `electron/main/index.ts` — this is a known limitation, not a bug to silently change without discussing with the user
- Do not expose Node/Electron APIs directly; always go through the preload bridge
