// Game loop: requestAnimationFrame dengan dt clamp, raf bisa di-inject untuk test.
export function createLoop({ update, render, raf }) {
  const _raf = raf ?? defaultRaf();
  let running = false;
  let ticks = 0;
  let last = 0;

  function frame(t) {
    if (!running) return;
    const now = typeof t === 'number' ? t : 0;
    const dt = last > 0 ? Math.min((now - last) / 1000, 0.1) : 0;
    last = now;
    ticks += 1;
    update(dt);
    render();
    _raf(frame);
  }

  return {
    start() {
      if (running) return;
      running = true;
      last = 0;
      _raf(frame);
    },
    stop() {
      running = false;
    },
    tickCount() {
      return ticks;
    },
  };
}

function defaultRaf() {
  if (typeof requestAnimationFrame !== 'undefined') return requestAnimationFrame;
  return (cb) => setTimeout(() => cb(Date.now()), 16);
}
