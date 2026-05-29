/**
 * Run `worker` against every `item` with at most `limit` in flight at once.
 * Used by the network rules to keep the lint pass from opening hundreds of
 * sockets against the same origin.
 */
export async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const results: R[] = new Array(items.length);
  const queue = items.map((item, index) => ({ item, index }));
  const active: Promise<void>[] = [];

  while (queue.length > 0 || active.length > 0) {
    while (active.length < limit && queue.length > 0) {
      const { item, index } = queue.shift()!;
      const promise = worker(item, index)
        .then((value) => {
          results[index] = value;
        })
        .finally(() => {
          active.splice(active.indexOf(promise), 1);
        });
      active.push(promise);
    }
    if (active.length > 0) {
      await Promise.race(active);
    }
  }
  return results;
}
