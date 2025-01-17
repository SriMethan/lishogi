import throttle from './throttle';

export function runner(hacks: () => void, throttleMs: number = 100): void {
  let timeout: number | undefined;

  const runHacks = throttle(throttleMs, () =>
    requestAnimationFrame(() => {
      hacks();
      schedule();
    })
  );

  function schedule() {
    timeout && clearTimeout(timeout);
    timeout = setTimeout(runHacks, 500);
  }

  runHacks();
}

let boundShogigroundResize = false;

export function bindShogigroundResizeOnce(f: () => void): void {
  if (!boundShogigroundResize) {
    boundShogigroundResize = true;
    document.body.addEventListener('shogiground.resize', f);
  }
}
