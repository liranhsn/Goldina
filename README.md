# Inventory (Electron + React + SQLite)

Single-machine inventory app tracking **gold**, **silver**, and **accessories**.

## Stack
- Electron (main = backend, preload = bridge, renderer = React UI)
- SQLite via `better-sqlite3` (WAL, local file in app data dir)
- TypeScript, Vite, electron-vite
- Vitest tests

## Features
- Menu: Gold / Silver / Accessories
- Metals: Add grams, Sell grams, balance + recent transactions
- Accessories: Add item, Sell item, filter (Available / Sold / All)

## Dev setup
1. Install Node (LTS) and Xcode CLT (macOS): `xcode-select --install`
2. Install deps:
   ```bash
   npm install
   ```
3. Run dev:
   ```bash
   npm run dev
   ```

## Build
- macOS artifact:
  ```bash
  npm run build:mac
  ```
- Windows installer: run `npm run build:win` **on a Windows runner** (e.g., GitHub Actions).

## Notes
- Native module `better-sqlite3` is **externalized** during build and **ASAR-unpacked** in packaging (see `package.json` and `electron.vite.config.ts`).
- DB path: Electron `app.getPath('userData')/data.db`.
- Validation in main process: grams > 0 (<=3 dp), no oversell, accessories prices >= 0.

## Tests
```
npm test
```

## File layout
```
electron/
  main/ (domain, db, ipc)
  preload/ (bridge)
src/renderer/ (React UI)
tests/ (vitest)
```
