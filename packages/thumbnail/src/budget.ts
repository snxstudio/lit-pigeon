/** Thrown when the whole launch → load → capture sequence outruns its budget. */
export class ThumbnailTimeoutError extends Error {
  readonly code = 'THUMBNAIL_TIMEOUT';

  constructor(readonly timeoutMs: number) {
    super(`Thumbnail rendering exceeded its ${timeoutMs}ms budget.`);
    this.name = 'ThumbnailTimeoutError';
  }
}

/**
 * Runs `work` under a hard deadline covering the whole sequence, not each
 * step, and guarantees everything it opened is closed either way.
 *
 * Headless browsers are the one dependency here that can hang rather than
 * fail, so a plain `Promise.race` is not enough: the losing work carries on
 * and leaks a browser process. `work` registers each resource through `keep`,
 * and a resource registered after the deadline has already passed is closed
 * immediately — which covers a launch that resolves long after we gave up.
 */
export async function withBudget<T>(
  timeoutMs: number,
  work: (keep: (close: () => Promise<unknown>) => void) => Promise<T>,
): Promise<T> {
  const open: Array<() => Promise<unknown>> = [];
  let finished = false;
  const closeQuietly = (close: () => Promise<unknown>) => {
    void Promise.resolve()
      .then(close)
      .catch(() => {});
  };
  const keep = (close: () => Promise<unknown>) => {
    if (finished) closeQuietly(close);
    else open.push(close);
  };

  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ThumbnailTimeoutError(timeoutMs)), timeoutMs);
  });

  const running = work(keep);
  // The race discards one of these; neither may surface as an unhandled rejection.
  running.catch(() => {});
  deadline.catch(() => {});

  try {
    return await Promise.race([running, deadline]);
  } finally {
    clearTimeout(timer);
    finished = true;
    await Promise.all(
      open.map((close) =>
        Promise.resolve()
          .then(close)
          .catch(() => {}),
      ),
    );
  }
}
