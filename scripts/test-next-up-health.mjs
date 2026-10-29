#!/usr/bin/env node
import {
  buildNextUpHtml,
  getNextHealthMilestone,
  formatHealthMilestoneAt,
  allFirstYearHealthMilestonesReached,
} from '../js/next-up.js';
import { HEALTH_MILESTONES } from '../js/health-milestones.js';

const MS_H = 60 * 60 * 1000;
const m48 = HEALTH_MILESTONES.find((m) => m.id === 'nhs-48h');
if (!m48) {
  console.error('missing nhs-48h fixture');
  process.exit(1);
}

const now = Date.now();
const quitMs = now - (39 * MS_H + 21 * 60 * 1000);
const state = {
  profile: {
    quitDate: new Date(quitMs).toISOString(),
    cigsPerDay: 15,
    cigsPerPack: 20,
    packPrice: 12,
    currency: 'USD',
  },
};

const next = getNextHealthMilestone(state, now);
if (!next || next.id !== 'nhs-48h') {
  console.error('expected next health milestone nhs-48h, got', next?.id);
  process.exit(1);
}

const html = buildNextUpHtml(state, now, (s) => s);
const display48 = m48.headline || m48.benefit;
if (!html.includes(display48)) {
  console.error('next-up HTML missing 48h display benefit');
  process.exit(1);
}
if (html.includes('monóxido de carbono baja al nivel')) {
  console.error('next-up should use short headline, not long 48h benefit');
  process.exit(1);
}
if (!html.includes(formatHealthMilestoneAt(m48.title))) {
  console.error('next-up HTML missing at-label for 48h');
  process.exit(1);
}
if (html.includes('next-up-health-benefit') === false || !html.includes('next-up-health-at')) {
  console.error('next-up HTML missing health layout classes');
  process.exit(1);
}
if (html.match(/next-up-title[^>]*>48 hours/)) {
  console.error('next-up should not use bare milestone time as main title');
  process.exit(1);
}

const MS_D = 24 * MS_H;
const at400d = {
  profile: {
    quitDate: new Date(now - 400 * MS_D).toISOString(),
    cigsPerDay: 15,
    cigsPerPack: 20,
    packPrice: 12,
    currency: 'USD',
  },
};
if (!allFirstYearHealthMilestonesReached(at400d, now)) {
  console.error('400d should complete first-year health milestones');
  process.exit(1);
}
if (getNextHealthMilestone(at400d, now)) {
  console.error('next health at 400d should be null (no 5y milestone)');
  process.exit(1);
}
const html400 = buildNextUpHtml(at400d, now, (s) => s);
if (html400.includes('5 años') || html400.includes('1426d')) {
  console.error('next-up at 400d must not show long-term health countdown');
  process.exit(1);
}
if (!html400.includes('Todos los hitos de salud del primer año alcanzados')) {
  console.error('next-up at 400d should show first-year complete copy');
  process.exit(1);
}

console.log('next-up health OK');
