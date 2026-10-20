# Quit Tracker

Personal quit-smoking tracker for **Silvio** — a static, mobile-first web app inspired by the best of [NoPuff](https://trynopuff.com/) and [QuitNow!](https://quitnow.app/en).

**Live site:** [https://silvio-dotcom.github.io/quit-tracker/](https://silvio-dotcom.github.io/quit-tracker/)

## Features

- **Dashboard** — Live smoke-free timer, cigarettes avoided, money saved, life regained, and clean-day streak
- **Health timeline** — WHO-aligned recovery milestones with progress bars (20 min → 15 years)
- **Personal ranking** — NoPuff-inspired rank ladder (icons + tiers) from smoke-free time and cravings resisted; progress bar, full ladder, rank-up celebration, current vs best streak, and exportable leaderboard score for a future online board
- **Achievements** — Badges for time smoke-free, money saved, cigarettes avoided, cravings resisted, and streaks
- **Craving support** — “I'm craving” flow with intensity, triggers, notes, box-breathing exercise, and honest slip logging
- **Charts** — Last 14 days of cravings, slips, and cumulative money saved
- **Personal motivation** — Editable “reasons I'm quitting” list and a savings goal with progress
- **Privacy** — No accounts or server; all data in `localStorage` with **Export / Import JSON** backup
- **PWA** — Installable on your phone; works offline via service worker

## Tech

Plain HTML, CSS, and ES modules — no build step. GitHub Pages serves the repo root; `.nojekyll` is included for Jekyll-free hosting.

## Local preview

Serve the repo root, then open under the same subpath as production:

```bash
# Example: copy or symlink into a parent folder named quit-tracker
mkdir -p /tmp/pages/quit-tracker
cp -r . /tmp/pages/quit-tracker/
cd /tmp/pages && python3 -m http.server 8080
# Visit http://localhost:8080/quit-tracker/
```

Or open `./index.html` via any static server at the site root if you only need a quick UI check.

## Data

Backup regularly from **More → Export JSON**. Import restores cravings, slips, settings, reasons, and goals.

## Health timeline sources

Milestone text in `js/health-milestones.js` is quoted (or closely paraphrased only where the page uses second person) from:

| Source | URL |
|--------|-----|
| WHO — *Tobacco: Health benefits of smoking cessation* (Q&amp;A) | https://www.who.int/news-room/questions-and-answers/item/tobacco-health-benefits-of-smoking-cessation |
| NHS Better Health — *Quit smoking* | https://www.nhs.uk/better-health/quit-smoking/ |
| CDC — *Benefits of Quitting Smoking* | https://www.cdc.gov/tobacco/about/benefits-of-quitting.html |

For ranged milestones (e.g. WHO “2–12 weeks”), the app uses the **lower bound** of the range for the progress timer. Additional context on long-term cessation benefits appears in the [2020 Surgeon General's Report on Smoking Cessation](https://www.hhs.gov/surgeongeneral/reports-and-publications/tobacco/2020-cessation-sgr/index.html) and [American Cancer Society quitting timeline](https://www.cancer.org/healthy/stay-away-from-tobacco/benefits-of-quitting-smoking-over-time.html); this app only shows milestones with explicit timepoints verified on the pages above.

---

*You've got this.* 🌿
