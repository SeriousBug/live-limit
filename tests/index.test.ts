/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars-experimental */
import { LiveLimit, MaxReachedBehavior } from "../src";

/**
 * @param ms The number of milliseconds to sleep for.
 */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

describe("WHEN there's a single call", () => {
  test("Resolves once that function call is done", async () => {
    const limiter = new LiveLimit({ maxLive: 3 });
    let called = false;

    await limiter.limit(async () => {
      called = true;
    });
    expect(called).toBeTruthy();
  });
});

describe("WHEN there are more calls than the limit", () => {
  describe("AND using default settings", () => {
    test("Resolves once all calls are done", async () => {
      const limiter = new LiveLimit({ maxLive: 3 });
      let calls = 0;

      await Promise.all([1, 2, 3, 4, 5].map(async () => {
        await limiter.limit(async () => {
          calls = calls + 1;
          await sleep(100);
        });
      }));
      expect(calls).toEqual(5);
    });
  });

  describe("AND using the queue setting", () => {
    test("Resolves once all calls are done", async () => {
      const limiter = new LiveLimit({ maxLive: 3,
        maxReached: MaxReachedBehavior.Queue });
      let calls = 0;

      await Promise.all([1, 2, 3, 4, 5].map(async () => {
        await limiter.limit(async () => {
          calls = calls + 1;
          await sleep(100);
        });
      }));
      expect(calls).toEqual(5);
    });
  });

  describe("AND using the drop setting", () => {
    test("Some calls are dropped", async () => {
      const limiter = new LiveLimit({ maxLive: 2,
        maxReached: MaxReachedBehavior.Drop });
      let calls = 0;

      await Promise.all([1, 2, 3, 4, 5,].map(async () => {
        await limiter.limit(async () => {
          calls = calls + 1;
          await sleep(100);
        });
      }));
      expect(calls).toBeLessThan(5);
    });
  });
});