#!/usr/bin/env node
import { moneySaved } from '../js/stats.js';
import { widgetMoneyRaw, WIDGET_FIXTURE_PROFILE } from '../js/widget-compute.js';

const MS_H = 60 * 60 * 1000;
const MS_D = 24 * MS_H;

function assertMatch(elapsedMs, label) {
  const quit = new Date(Date.now() - elapsedMs).toISOString();
  const state = { profile: { ...WIDGET_FIXTURE_PROFILE, quitDate: quit } };
  const web = moneySaved(state, Date.now());
  const widget = widgetMoneyRaw(elapsedMs, WIDGET_FIXTURE_PROFILE);
  if (Math.abs(web - widget) > 0.0001) {
    console.error(`${label}: web=${web} widget=${widget}`);
    process.exit(1);
  }
}

assertMatch(30 * MS_H, '30h');
assertMatch(45 * MS_D, '45d');
assertMatch(400 * MS_D, '400d');

console.log('widget money OK');
