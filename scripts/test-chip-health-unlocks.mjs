#!/usr/bin/env node
import {
  CHIP_HEALTH_UNLOCKS,
  CHIP_HEALTH_UNLOCK_TIER_IDS,
  chipHealthFact,
  isChipHealthUnlockTier,
} from '../js/chip-health-unlocks.js';

const EXPECTED = ['chip-1w', 'chip-2w', 'chip-3w', 'chip-1mo'];

if (CHIP_HEALTH_UNLOCK_TIER_IDS.size !== 4) {
  console.error('expected 4 health unlock chips');
  process.exit(1);
}
for (const id of EXPECTED) {
  if (!isChipHealthUnlockTier(id)) {
    console.error(`missing tier ${id}`);
    process.exit(1);
  }
  const row = CHIP_HEALTH_UNLOCKS[id];
  if (!row?.factEn?.trim() || !row?.factEs?.trim()) {
    console.error(`missing copy for ${id}`);
    process.exit(1);
  }
  if (chipHealthFact(id) !== row.factEn) {
    console.error(`en fact mismatch for ${id}`);
    process.exit(1);
  }
  if (chipHealthFact(id, 'es') !== row.factEs) {
    console.error(`es fact mismatch for ${id}`);
    process.exit(1);
  }
}

if (isChipHealthUnlockTier('chip-24h')) {
  console.error('24h should not be a health unlock tier');
  process.exit(1);
}

console.log('chip-health-unlocks ok');
