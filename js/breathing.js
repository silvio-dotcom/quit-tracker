/** Box breathing: 4s in, 4s hold, 4s out, 4s hold — ~3 minutes default (3 cycles). */

const PHASES = [
  { name: 'Breathe in', seconds: 4 },
  { name: 'Hold', seconds: 4 },
  { name: 'Breathe out', seconds: 4 },
  { name: 'Hold', seconds: 4 },
];

export function createBreathingSession({ onPhase, onTick, onComplete, cycles = 3 }) {
  let phaseIndex = 0;
  let cycle = 0;
  let remaining = PHASES[0].seconds;
  let timer = null;
  let running = false;

  function tick() {
    remaining -= 1;
    onTick?.(remaining, PHASES[phaseIndex]);
    if (remaining <= 0) {
      phaseIndex += 1;
      if (phaseIndex >= PHASES.length) {
        phaseIndex = 0;
        cycle += 1;
        if (cycle >= cycles) {
          stop();
          onComplete?.();
          return;
        }
      }
      remaining = PHASES[phaseIndex].seconds;
      onPhase?.(PHASES[phaseIndex], phaseIndex, cycle);
    }
  }

  function start() {
    if (running) return;
    running = true;
    phaseIndex = 0;
    cycle = 0;
    remaining = PHASES[0].seconds;
    onPhase?.(PHASES[0], 0, 0);
    onTick?.(remaining, PHASES[0]);
    timer = setInterval(tick, 1000);
  }

  function stop() {
    running = false;
    if (timer) clearInterval(timer);
    timer = null;
  }

  return { start, stop, isRunning: () => running };
}
