import {
  TIME_ACHIEVEMENTS,
  CIGS_SPECS,
  MONEY_SPECS,
  TIMEBACK_SPECS,
} from './achievements-catalog.js';
import { cigarettesAvoided, moneySaved } from './stats.js';

const MS_D = 24 * 60 * 60 * 1000;
export const BADGE_YEAR_MS = 365 * MS_D;
const TIME_BACK_MINUTES_PER_CIG = 6;

const MIN_STEP_RATIO = 1.2;

const MONEY_LADDER = [
  5, 10, 25, 50, 100, 250, 500, 1000, 1500, 2000, 2500, 5000, 7500, 10000, 15000, 20000, 25000, 50000,
];

const CIGS_LADDER = [
  1, 5, 10, 25, 50, 100, 200, 250, 500, 750, 1000, 1500, 2000, 2500, 5000, 7500, 10000,
];

const PACK_LADDER = [1, 2, 5, 10, 15, 20, 25, 50, 75, 100, 150, 200];

const MINUTES_LADDER = [
  30, 60, 90, 120, 180, 360, 720, 1440, 2880, 4320, 10080, 20160, 43200, 86400, 129600, 259200, 525600,
];

function ladderUpTo(ladder, max) {
  const cap = Math.max(max, ladder[0]);
  const out = ladder.filter((n) => n <= cap);
  const top = ceilingOnLadder(ladder, max);
  if (!out.length || out[out.length - 1] < top) out.push(top);
  return [...new Set(out)].sort((a, b) => a - b);
}

function ceilingOnLadder(ladder, value) {
  for (const n of ladder) {
    if (n >= value) return n;
  }
  const mag = 10 ** Math.floor(Math.log10(Math.max(value, 1)));
  const norm = value / mag;
  const pick = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return Math.ceil(pick * mag);
}

function pickOnLadder(ladder, ideal, prev, maxInclusive = Infinity) {
  const floor = Math.max(1, prev ? Math.ceil(prev * MIN_STEP_RATIO) : 1);
  const candidates = ladder.filter((n) => n >= floor && n <= maxInclusive);
  if (!candidates.length) {
    const v = Math.min(maxInclusive, Math.max(floor, Math.round(ideal)));
    return v > prev && v <= maxInclusive ? v : Math.min(maxInclusive, floor);
  }
  let best = candidates[0];
  for (const c of candidates) {
    if (Math.abs(c - ideal) < Math.abs(best - ideal)) best = c;
  }
  if (best <= prev) {
    const next = candidates.find((n) => n > prev);
    if (next) return next;
    const v = Math.min(maxInclusive, Math.max(floor, Math.round(ideal)));
    return v > prev ? v : Math.min(maxInclusive, prev + 1);
  }
  return best;
}

function moneyDesc(amount, isYear) {
  const label = amount >= 1000 ? amount.toLocaleString() : String(amount);
  if (isYear) return `A full year of savings — about ${label} kept.`;
  return `${label} saved instead of spent on cigarettes.`;
}

function cigsDesc(count, isYear) {
  const label = count.toLocaleString();
  if (isYear) return `Your one-year total: ${label} cigarettes not smoked.`;
  return `${label} cigarettes never lit.`;
}

function timebackDesc(minutes, isYear) {
  if (isYear) return 'A year of life back from not smoking.';
  if (minutes < 60) return `${minutes} minutes of life regained.`;
  if (minutes < 1440) {
    const h = Math.round(minutes / 60);
    return `${h} hour${h === 1 ? '' : 's'} of life regained.`;
  }
  const d = Math.round(minutes / 1440);
  return `${d} day${d === 1 ? '' : 's'} of life regained.`;
}

export function yearHorizonMetrics(profile) {
  const quit = profile.quitDate ? new Date(profile.quitDate).getTime() : Date.now();
  const atYear = quit + BADGE_YEAR_MS;
  const state = { profile };
  const cigs = cigarettesAvoided(state, atYear);
  const money = moneySaved(state, atYear);
  const cpp = Number(profile.cigsPerPack) || 20;
  return {
    cigs,
    money,
    packs: cigs / cpp,
    regainedMinutes: cigs * TIME_BACK_MINUTES_PER_CIG,
  };
}

function assignInteriorValues(specs, yearCap, ladder) {
  const k = specs.length;
  if (!k) return new Map();
  const maxInterior = Math.max(1, Math.floor(yearCap / MIN_STEP_RATIO));
  const minInterior = Math.max(1, ladder[0] ?? 1);
  const pool = ladder.filter((n) => n <= maxInterior);
  let prev = 0;
  const values = new Map();
  for (let i = 0; i < k; i++) {
    const spec = specs[i];
    const ideal = minInterior * (maxInterior / minInterior) ** ((i + 1) / k);
    const v = pickOnLadder(pool.length ? pool : ladder, ideal, prev, maxInterior);
    prev = v;
    values.set(spec.id, v);
  }
  return values;
}

function assignInteriorSeries(specs, yearCap, ladder, yearSpecId) {
  const interior = specs.filter((s) => s.id !== yearSpecId);
  const values = assignInteriorValues(interior, yearCap, ladder);
  values.set(yearSpecId, yearCap);
  return values;
}

function buildCigsAchievements(profile, horizon) {
  const cpp = Number(profile.cigsPerPack) || 20;
  const yearCount = Math.max(1, Math.round(horizon.cigs));
  const interiorSpecs = CIGS_SPECS.filter((s) => s.id !== 'cigs-year');
  const maxInterior = Math.max(1, Math.floor(yearCount / MIN_STEP_RATIO));
  const minStart = 5;
  const stepRatio = (maxInterior / minStart) ** (1 / interiorSpecs.length);
  const byId = new Map();
  let prevEquiv = 0;

  for (let i = 0; i < interiorSpecs.length; i++) {
    const spec = interiorSpecs[i];
    let equiv = Math.round(minStart * stepRatio ** (i + 1));
    const minE = prevEquiv ? Math.ceil(prevEquiv * MIN_STEP_RATIO) : 1;
    if (minE > maxInterior) {
      const remaining = interiorSpecs.length - i;
      equiv = Math.round(prevEquiv + (maxInterior - prevEquiv) / (remaining + 1));
    } else {
      equiv = Math.max(minE, Math.min(maxInterior, equiv));
    }
    if (spec.packFraction != null) {
      const packs = Math.max(1, Math.ceil(equiv / cpp));
      const title =
        spec.id === 'cigs-first-pack'
          ? 'First pack'
          : spec.id === 'cigs-5pack'
            ? '5 packs'
            : spec.id === 'cigs-10pack'
              ? '10 packs'
              : `${packs} pack${packs === 1 ? '' : 's'}`;
      byId.set(spec.id, {
        id: spec.id,
        category: 'cigs',
        icon: spec.icon,
        title,
        desc: `${packs} pack${packs === 1 ? '' : 's'} avoided.`,
        packs,
      });
      prevEquiv = packs * cpp;
    } else {
      const count = equiv;
      const title = spec.id === 'cigs-1' ? 'First cigarette' : `${count.toLocaleString()} avoided`;
      byId.set(spec.id, {
        id: spec.id,
        category: 'cigs',
        icon: spec.icon,
        title,
        desc: cigsDesc(count, false),
        count,
      });
      prevEquiv = count;
    }
  }

  byId.set('cigs-year', {
    id: 'cigs-year',
    category: 'cigs',
    icon: CIGS_SPECS.find((s) => s.id === 'cigs-year').icon,
    title: `${yearCount.toLocaleString()} avoided`,
    desc: cigsDesc(yearCount, true),
    count: yearCount,
  });

  return CIGS_SPECS.map((s) => byId.get(s.id));
}

function buildMoneyAchievements(horizon) {
  const yearCap = Math.max(1, Math.round(horizon.money));
  const interior = MONEY_SPECS.filter((s) => s.id !== 'money-year');
  const values = new Map();
  const maxInterior = Math.max(1, Math.floor(yearCap / MIN_STEP_RATIO));
  const minStart = MONEY_LADDER[0];
  const stepRatio = (maxInterior / minStart) ** (1 / interior.length);
  let prev = 0;
  for (let i = 0; i < interior.length; i++) {
    let amount = Math.round(minStart * stepRatio ** (i + 1));
    const minV = prev ? Math.ceil(prev * MIN_STEP_RATIO) : minStart;
    if (minV > maxInterior) {
      const remaining = interior.length - i;
      amount = Math.round(prev + (maxInterior - prev) / (remaining + 1));
    } else {
      amount = Math.max(minV, Math.min(maxInterior, amount));
    }
    prev = amount;
    values.set(interior[i].id, amount);
  }
  values.set('money-year', yearCap);
  return MONEY_SPECS.map((spec) => {
    const isYear = spec.id === 'money-year' || spec.yearFraction >= 1;
    const amount = values.get(spec.id);
    return {
      id: spec.id,
      category: 'money',
      icon: spec.icon,
      title: spec.id === 'money-year' ? 'Year savings' : spec.title,
      desc: moneyDesc(amount, isYear),
      amount,
    };
  });
}

function buildTimebackAchievements(horizon) {
  const yearCap = Math.max(30, Math.round(horizon.regainedMinutes));
  const values = assignInteriorSeries(TIMEBACK_SPECS, yearCap, MINUTES_LADDER, 'timeback-year');
  return TIMEBACK_SPECS.map((spec) => {
    const isYear = spec.id === 'timeback-year' || spec.yearFraction >= 1;
    const regainedMinutes = values.get(spec.id);
    const title = isYear ? '1 year back' : spec.title;
    return {
      id: spec.id,
      category: 'timeback',
      icon: spec.icon,
      title,
      desc: timebackDesc(regainedMinutes, isYear),
      regainedMinutes,
    };
  });
}

/** @param {import('./constants.js').profile} profile */
export function buildAchievementsForProfile(profile) {
  const horizon = yearHorizonMetrics(profile);
  const scaled = [
    ...buildCigsAchievements(profile, horizon),
    ...buildMoneyAchievements(horizon),
    ...buildTimebackAchievements(horizon),
  ];
  const byId = new Map(scaled.map((a) => [a.id, a]));
  const ordered = [];
  for (const spec of [...CIGS_SPECS, ...MONEY_SPECS, ...TIMEBACK_SPECS]) {
    const a = byId.get(spec.id);
    if (a) ordered.push(a);
  }
  return [...TIME_ACHIEVEMENTS, ...ordered];
}

export function maxBadgeHorizonMs(state, now = Date.now()) {
  const quit = state.profile?.quitDate ? new Date(state.profile.quitDate).getTime() : null;
  if (!quit) return BADGE_YEAR_MS;
  return Math.max(0, quit + BADGE_YEAR_MS - now);
}

/** @returns {{ money: number[], cigs: number[], timeback: number[] }} */
export function scaledThresholdLists(profile) {
  const cpp = Number(profile.cigsPerPack) || 20;
  const list = buildAchievementsForProfile(profile);
  return {
    money: list.filter((a) => a.category === 'money').map((a) => a.amount),
    cigs: list
      .filter((a) => a.category === 'cigs')
      .map((a) => (a.packs != null ? a.packs * cpp : a.count)),
    timeback: list.filter((a) => a.category === 'timeback').map((a) => a.regainedMinutes),
  };
}
