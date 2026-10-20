# Quit Tracker

Personal quit-smoking tracker for **Silvio** — a static, mobile-first web app inspired by [QuitNow!](https://quitnow.app/en) and [NoPuff](https://trynopuff.com/) (simplified: progress, health, ranks).

**Live site:** [https://silvio-dotcom.github.io/quit-tracker/](https://silvio-dotcom.github.io/quit-tracker/)

## Features

- **Dashboard** — Live smoke-free timer, cigarettes avoided, money saved, current streak
- **Health on home** — Next sourced milestone with live progress, recently achieved milestones, expandable full WHO/CDC/NHS timeline with source links
- **Personal ranking** — Rank ladder based on smoke-free time only; progress bar, rank-up celebration, exportable leaderboard score
- **Achievements** — Time, savings, and streak badges
- **Start over** — “I smoked” resets quit date to now (with confirm)
- **Settings & backup** — Profile setup, export/import JSON, PWA offline support (build v5 cache recovery)

## Tech

Plain HTML, CSS, and ES modules — no build step. GitHub Pages serves the repo root; `.nojekyll` is included.

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
