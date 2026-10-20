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
      'Your oxygen levels are recovering, and the harmful carbon monoxide level in your blood will have reduced by half.',
    headline: 'Oxygen is recovering; carbon monoxide in your blood is half.',
    source: {
      name: 'NHS Better Health',
      url: 'https://www.nhs.uk/better-health/quit-smoking/',
    },
  },
  {
    id: 'who-12h',
    title: '12 hours',
    timeMs: 12 * H,
    benefit: 'The carbon monoxide level in your blood drops to normal.',
    source: {
      name: 'WHO',
      url: 'https://www.who.int/news-room/questions-and-answers/item/tobacco-health-benefits-of-smoking-cessation',
    },
  },
  {
    id: 'cdc-24h',
    title: '24 hours',
    timeMs: 24 * H,
    benefit: 'Nicotine level in the blood drops to zero.',
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
      'Your carbon monoxide levels have dropped to that of a non-smoker. Your lungs are clearing out mucus and your senses of taste and smell are improving.',
    headline: 'Carbon monoxide is out of your body.',
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
      "If you notice that breathing feels easier, it's because your bronchial tubes have started to relax. Also your energy will be increasing.",
    headline: 'Breathing may feel easier and energy is rising.',
    source: {
      name: 'NHS Better Health',
      url: 'https://www.nhs.uk/better-health/quit-smoking/',
    },
  },
  {
    id: 'who-2-12w',
    title: '2–12 weeks',
    timeMs: 14 * D,
    benefit: 'Your circulation improves and your lung function increases.',
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
    benefit: "Your risk of coronary heart disease is about half that of a smoker's.",
    source: {
      name: 'WHO',
      url: 'https://www.who.int/news-room/questions-and-answers/item/tobacco-health-benefits-of-smoking-cessation',
    },
  },
  {
    id: 'who-5y',
    title: '5 years',
    timeMs: 5 * Y,
    benefit: 'Your stroke risk is reduced to that of a nonsmoker 5 to 15 years after quitting.',
    headline: "Stroke risk is moving toward a nonsmoker's level.",
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
      'Your risk of lung cancer falls to about half that of a smoker and your risk of cancer of the mouth, throat, esophagus, bladder, cervix, and pancreas decreases.',
    headline: "Lung cancer risk is about half a smoker's.",
    source: {
      name: 'WHO',
      url: 'https://www.who.int/news-room/questions-and-answers/item/tobacco-health-benefits-of-smoking-cessation',
    },
  },
  {
    id: 'who-15y',
    title: '15 years',
    timeMs: 15 * Y,
    benefit: "The risk of coronary heart disease is that of a nonsmoker's.",
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
