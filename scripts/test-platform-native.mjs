#!/usr/bin/env node
import { detectNativeEnvironment, isNativePlatform } from '../js/platform.js';

if (!detectNativeEnvironment({ userAgent: 'Mozilla QuitTrackerAndroid' })) {
  console.error('UA marker should detect native');
  process.exit(1);
}

if (detectNativeEnvironment({ userAgent: 'Mozilla', capacitor: { isNativePlatform: () => true } })) {
  // ok
} else {
  console.error('isNativePlatform should detect');
  process.exit(1);
}

if (detectNativeEnvironment({ userAgent: 'Mozilla', capacitor: { getPlatform: () => 'android' } })) {
  // ok
} else {
  console.error('getPlatform android should detect');
  process.exit(1);
}

if (detectNativeEnvironment({ userAgent: 'Mozilla Chrome' })) {
  console.error('plain web UA should not be native');
  process.exit(1);
}

if (isNativePlatform()) {
  console.error('isNativePlatform should be false in node');
  process.exit(1);
}

console.log('platform native detection OK');
