#!/usr/bin/env node
import { buildNextUpHtml, getNextHealthMilestone, formatHealthMilestoneAt } from '../js/next-up.js';
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
if (html.includes('non-smoker. Your lungs')) {
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

console.log('next-up health OK');
