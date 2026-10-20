#!/usr/bin/env node
import {
  HEALTH_MILESTONES,
  HEALTH_BENEFIT_INLINE_MAX,
  healthBenefitDisplay,
} from '../js/health-milestones.js';

for (const m of HEALTH_MILESTONES) {
  const benefitLen = m.benefit.length;
  if (benefitLen > HEALTH_BENEFIT_INLINE_MAX) {
    if (!m.headline?.trim()) {
      console.error(`missing headline for ${m.id} (benefit ${benefitLen} chars)`);
      process.exit(1);
    }
  }
  const display = healthBenefitDisplay(m);
  if (display.length > HEALTH_BENEFIT_INLINE_MAX) {
    console.error(`${m.id}: display line too long (${display.length} > ${HEALTH_BENEFIT_INLINE_MAX})`);
    process.exit(1);
  }
  if (display.endsWith('...') || display.includes('…')) {
    console.error(`${m.id}: display looks truncated`);
    process.exit(1);
  }
  if (!/[.!?]$/.test(display.trim())) {
    console.error(`${m.id}: display should end with sentence punctuation`);
    process.exit(1);
  }
}

console.log('health headlines OK');
