# Quit Tracker

Personal quit-smoking tracker for **Silvio** — a static, mobile-first web app inspired by [QuitNow!](https://quitnow.app/en) and [NoPuff](https://trynopuff.com/) (simplified: progress, health, ranks).

**Live site:** [https://silvio-dotcom.github.io/quit-tracker/](https://silvio-dotcom.github.io/quit-tracker/)

## Features

- **Dashboard** — Live smoke-free timer, cigarettes avoided, money saved, current streak
- **Health on home** — Next sourced milestone with live progress, recently achieved milestones, expandable full WHO/CDC/NHS timeline with source links
- **Personal ranking** — Rank ladder based on smoke-free time only; progress bar, rank-up celebration, exportable leaderboard score
- **Badges** — QuitNow-style categories (time, cigarettes avoided, money saved) with progress
- **Start over** — “I smoked” resets quit date to now (with confirm)
- **Settings & backup** — Profile setup, export/import JSON, PWA offline support (build v5 cache recovery)

## Tech

Plain HTML, CSS, and ES modules for the PWA. **Capacitor** wraps the same assets for Android (`www/` is a sync copy for native only; GitHub Pages still serves the repo root). `.nojekyll` is included.

### Android APK (personal sideload)

After merge to `main`, CI publishes a debug-signed APK:

**https://github.com/silvio-dotcom/quit-tracker/releases/download/latest-apk/quit-tracker.apk**

The shared debug keystore in `android/quit-tracker-debug.keystore` is intentional so updates install over the previous APK without uninstalling — **personal use only**, not for Play Store.

Local build:

```bash
npm ci && npm run icons && npm run cap:sync && npm run icons:android
cd android && ./gradlew assembleDebug
```

## Local preview

```bash
mkdir -p /tmp/pages/quit-tracker && cp -r . /tmp/pages/quit-tracker/
cd /tmp/pages && python3 -m http.server 8080
# http://localhost:8080/quit-tracker/
```

## Health timeline sources

See `js/health-milestones.js` and the README section in the previous docs for WHO, NHS Better Health, and CDC URLs.

## Data

Backup from **More → Export JSON**. Older backups with cravings/slips/reasons are ignored safely on import.
