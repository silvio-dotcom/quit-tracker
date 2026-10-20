#!/usr/bin/env node
import { upcomingMilestoneNotifications, notificationIdForKey } from '../js/milestone-schedule.js';

const quit = new Date(Date.now() - 60 * 60 * 1000).toISOString();
const state = {
  profile: { quitDate: quit, cigsPerDay: 15, cigsPerPack: 20, packPrice: 12, currency: 'USD' },
};

const list = upcomingMilestoneNotifications(state, Date.now());
if (!list.length) {
  console.error('expected upcoming milestones');
  process.exit(1);
}
if (list[0].at <= Date.now()) {
  console.error('first item should be in the future');
  process.exit(1);
}
const id1 = notificationIdForKey('health:who-20m');
const id2 = notificationIdForKey('health:who-20m');
if (id1 !== id2) process.exit(1);
console.log('milestone schedule OK');
