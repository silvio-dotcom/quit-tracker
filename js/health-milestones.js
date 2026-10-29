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
    title: '20 minutos',
    timeMs: 20 * M,
    benefit: 'Tu frecuencia cardíaca y la presión arterial bajan.',
    source: {
      name: 'OMS',
      url: 'https://www.who.int/news-room/questions-and-answers/item/tobacco-health-benefits-of-smoking-cessation',
    },
  },
  {
    id: 'nhs-8h',
    title: '8 horas',
    timeMs: 8 * H,
    benefit:
      'Se recupera el oxígeno y el monóxido de carbono en la sangre se reduce a la mitad.',
    headline: 'El oxígeno se recupera; el CO en sangre cae a la mitad.',
    source: {
      name: 'NHS Better Health',
      url: 'https://www.nhs.uk/better-health/quit-smoking/',
    },
  },
  {
    id: 'who-12h',
    title: '12 horas',
    timeMs: 12 * H,
    benefit: 'El monóxido de carbono en la sangre vuelve a la normalidad.',
    source: {
      name: 'OMS',
      url: 'https://www.who.int/news-room/questions-and-answers/item/tobacco-health-benefits-of-smoking-cessation',
    },
  },
  {
    id: 'cdc-24h',
    title: '24 horas',
    timeMs: 24 * H,
    benefit: 'La nicotina en la sangre llega a cero.',
    source: {
      name: 'CDC',
      url: 'https://www.cdc.gov/tobacco/about/benefits-of-quitting.html',
    },
  },
  {
    id: 'nhs-48h',
    title: '48 horas',
    timeMs: 48 * H,
    benefit:
      'El monóxido de carbono baja al nivel de un no fumador. Los pulmones eliminan mucosidad y mejoran gusto y olfato.',
    headline: 'El monóxido de carbono sale de tu cuerpo.',
    source: {
      name: 'NHS Better Health',
      url: 'https://www.nhs.uk/better-health/quit-smoking/',
    },
  },
  {
    id: 'nhs-72h',
    title: '72 horas',
    timeMs: 72 * H,
    benefit:
      'Si respiras más fácil, es porque los bronquios empiezan a relajarse. También sube tu energía.',
    headline: 'Respirar puede sentirse más fácil y la energía sube.',
    source: {
      name: 'NHS Better Health',
      url: 'https://www.nhs.uk/better-health/quit-smoking/',
    },
  },
  {
    id: 'who-2-12w',
    title: '2–12 semanas',
    timeMs: 14 * D,
    benefit: 'Mejora la circulación y la función pulmonar.',
    source: {
      name: 'OMS',
      url: 'https://www.who.int/news-room/questions-and-answers/item/tobacco-health-benefits-of-smoking-cessation',
    },
  },
  {
    id: 'who-1-9m',
    title: '1–9 meses',
    timeMs: 30 * D,
    benefit: 'Disminuyen la tos y la falta de aire.',
    source: {
      name: 'OMS',
      url: 'https://www.who.int/news-room/questions-and-answers/item/tobacco-health-benefits-of-smoking-cessation',
    },
  },
  {
    id: 'who-1y',
    title: '1 año',
    timeMs: 1 * Y,
    benefit: 'El riesgo de enfermedad coronaria es casi la mitad que el de un fumador.',
    headline: 'Riesgo cardíaco casi la mitad del de un fumador.',
    source: {
      name: 'OMS',
      url: 'https://www.who.int/news-room/questions-and-answers/item/tobacco-health-benefits-of-smoking-cessation',
    },
  },
  {
    id: 'who-5y',
    title: '5 años',
    timeMs: 5 * Y,
    benefit: 'El riesgo de derrame se acerca al de alguien que nunca fumó (5 a 15 años después).',
    headline: 'El riesgo de derrame se acerca al de un no fumador.',
    source: {
      name: 'OMS',
      url: 'https://www.who.int/news-room/questions-and-answers/item/tobacco-health-benefits-of-smoking-cessation',
    },
  },
  {
    id: 'who-10y',
    title: '10 años',
    timeMs: 10 * Y,
    benefit:
      'El riesgo de cáncer de pulmón cae a casi la mitad del de un fumador y bajan otros cánceres.',
    headline: 'El riesgo de cáncer de pulmón es casi la mitad del de un fumador.',
    source: {
      name: 'OMS',
      url: 'https://www.who.int/news-room/questions-and-answers/item/tobacco-health-benefits-of-smoking-cessation',
    },
  },
  {
    id: 'who-15y',
    title: '15 años',
    timeMs: 15 * Y,
    benefit: 'El riesgo de enfermedad coronaria es el de alguien que nunca fumó.',
    source: {
      name: 'OMS',
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
