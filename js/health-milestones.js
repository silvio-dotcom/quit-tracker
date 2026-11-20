/**
 * Health recovery milestones after quitting smoking.
 * Wording is taken from cited public-health sources (not app folklore).
 * `timeMs` is the lower bound when a range is given (e.g. 2–12 weeks → 2 weeks).
 * `headline` — short UI line when `benefit` exceeds {@link HEALTH_BENEFIT_INLINE_MAX} chars.
 */

const M = 60 * 1000;
const H = 60 * M;
const D = 24 * H;
const Y = 365.25 * D;

/** Max chars for compact UI (Next up + health list); longer `benefit` uses `headline`. */
export const HEALTH_BENEFIT_INLINE_MAX = 70;

/** Last milestone included in first-year Next up / progress UI (`who-1y`). */
export const HEALTH_FIRST_YEAR_MS = 1 * Y;

export function isLongTermHealthMilestone(milestone) {
  return milestone.timeMs > HEALTH_FIRST_YEAR_MS;
}

/** @typedef {{ id: string, title: string, timeMs: number, benefit: string, headline?: string, source: { name: string, url: string } }} HealthMilestone */

/** @type {HealthMilestone[]} */
export const HEALTH_MILESTONES = [
  {
    id: 'who-20m',
    title: '20 minutes',
    timeMs: 20 * M,
    benefit: 'Your heart rate and blood pressure drop.',
    source: {
      name: 'WHO',
      url: 'https://www.who.int/news-room/questions-and-answers/item/tobacco-health-benefits-of-smoking-cessation',
    },
  },
  {
    id: 'nhs-8h',
    title: '8 hours',
    timeMs: 8 * H,
    benefit:
      'Oxygen levels recover and carbon monoxide in the blood falls by half.',
    headline: 'Oxygen recovers; blood CO drops by half.',
    source: {
      name: 'NHS Better Health',
      url: 'https://www.nhs.uk/better-health/quit-smoking/',
    },
  },
  {
    id: 'who-12h',
    title: '12 hours',
    timeMs: 12 * H,
    benefit: 'Carbon monoxide in the blood returns to normal.',
    source: {
      name: 'WHO',
      url: 'https://www.who.int/news-room/questions-and-answers/item/tobacco-health-benefits-of-smoking-cessation',
    },
  },
  {
    id: 'cdc-24h',
    title: '24 hours',
    timeMs: 24 * H,
    benefit: 'Nicotine in the blood drops to zero.',
    source: {
      name: 'CDC',
      url: 'https://www.cdc.gov/tobacco/about/benefits-of-quitting.html',
    },
  },
  {
    id: 'nhs-48h',
    title: '48 hours',
    timeMs: 48 * H,
    benefit:
      'Carbon monoxide falls to non-smoker levels. Lungs clear mucus and taste and smell improve.',
    headline: 'Carbon monoxide leaves your body.',
    source: {
      name: 'NHS Better Health',
      url: 'https://www.nhs.uk/better-health/quit-smoking/',
    },
  },
  {
    id: 'nhs-72h',
    title: '72 hours',
    timeMs: 72 * H,
    benefit:
      'If breathing feels easier, your bronchial tubes are starting to relax. Energy often picks up too.',
    headline: 'Breathing can feel easier and energy picks up.',
    source: {
      name: 'NHS Better Health',
      url: 'https://www.nhs.uk/better-health/quit-smoking/',
    },
  },
  {
    id: 'who-2-12w',
    title: '2–12 weeks',
    timeMs: 14 * D,
    benefit: 'Circulation and lung function improve.',
    source: {
      name: 'WHO',
      url: 'https://www.who.int/news-room/questions-and-answers/item/tobacco-health-benefits-of-smoking-cessation',
    },
  },
  {
    id: 'who-1-9m',
    title: '1–9 months',
    timeMs: 30 * D,
    benefit: 'Coughing and shortness of breath decrease.',
    source: {
      name: 'WHO',
      url: 'https://www.who.int/news-room/questions-and-answers/item/tobacco-health-benefits-of-smoking-cessation',
    },
  },
  {
    id: 'who-1y',
    title: '1 year',
    timeMs: 1 * Y,
    benefit: 'Risk of coronary heart disease is about half that of someone who still smokes.',
    headline: 'Heart risk about half that of a smoker.',
    source: {
      name: 'WHO',
      url: 'https://www.who.int/news-room/questions-and-answers/item/tobacco-health-benefits-of-smoking-cessation',
    },
  },
  {
    id: 'who-5y',
    title: '5 years',
    timeMs: 5 * Y,
    benefit: 'Stroke risk approaches that of someone who never smoked (5–15 years after quitting).',
    headline: 'Stroke risk nears that of a non-smoker.',
    source: {
      name: 'WHO',
      url: 'https://www.who.int/news-room/questions-and-answers/item/tobacco-health-benefits-of-smoking-cessation',
    },
  },
  {
    id: 'who-10y',
    title: '10 years',
    timeMs: 10 * Y,
    benefit:
      'Lung cancer risk falls to about half that of a smoker; other cancer risks drop too.',
    headline: 'Lung cancer risk about half that of a smoker.',
    source: {
      name: 'WHO',
      url: 'https://www.who.int/news-room/questions-and-answers/item/tobacco-health-benefits-of-smoking-cessation',
    },
  },
  {
    id: 'who-15y',
    title: '15 years',
    timeMs: 15 * Y,
    benefit: 'Risk of coronary heart disease matches someone who never smoked.',
    source: {
      name: 'WHO',
      url: 'https://www.who.int/news-room/questions-and-answers/item/tobacco-health-benefits-of-smoking-cessation',
    },
  },
];

/**
 * Compact benefit line for Next up and health list (full `benefit` stays in data for alerts/export).
 * @param {HealthMilestone} milestone
 */
export function healthBenefitDisplay(milestone) {
  const benefit = String(milestone.benefit || '').trim();
  if (benefit.length <= HEALTH_BENEFIT_INLINE_MAX) return benefit;
  const headline = String(milestone.headline || '').trim();
  if (headline) return headline;
  return benefit;
}