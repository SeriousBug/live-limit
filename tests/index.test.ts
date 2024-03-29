/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
  describe("AND that call resolves", () => {
    test("Resolves once that function call is done", async () => {
      const limiter = new LiveLimit({ maxLive: 3 });
      let called = false;

      await limiter.limit(async () => {
        called = true;
      });
      expect(called).toBeTruthy();
    });
  });

  describe("AND that call returns something", () => {
    test("Returns the value once that function call is done", async () => {
      const limiter = new LiveLimit({ maxLive: 3 });

      const result = await limiter.limit(async () => {
        return "result";
      });
      expect(result).toEqual("result");
    });
  });

  describe("AND that call rejects", () => {
    test("Rejects once that function call is done", async () => {
      const limiter = new LiveLimit({ maxLive: 3 });
      let called = false;

      await expect(
        limiter.limit(async () => {
          called = true;
          throw "err";
        })
      ).rejects.toEqual("err");
      expect(called).toBeTruthy();
    });
  });
});

describe("WHEN configuring the limit", () => {
  describe("AND the limit is set to negative", () => {
    test("Errors that the configuration is incorrect", () => {
      expect(() => {
        new LiveLimit({ maxLive: -1 });
      }).toThrow();
    });
  });

  describe("AND the limit is set to a floating point number", () => {
    test("Errors that the configuration is incorrect", () => {
      expect(() => {
        new LiveLimit({ maxLive: 3.5 });
      }).toThrow();
    });
  });
});

describe("WHEN there are more calls than the limit", () => {
  describe("AND all the calls resolve", () => {
    describe("AND using default settings", () => {
      test("Resolves once all calls are resolved", async () => {
        const limiter = new LiveLimit({ maxLive: 3 });
        let calls = 0;

        await Promise.all(
          [1, 2, 3, 4, 5].map(async () => {
            await limiter.limit(async () => {
              calls = calls + 1;
              await sleep(100);
            });
          })
        );
        expect(calls).toEqual(5);
      });
    });

    describe("AND using the queue setting", () => {
      test("Resolves once all calls are resolved", async () => {
        const limiter = new LiveLimit({
          maxLive: 3,
          maxReached: MaxReachedBehavior.Queue,
        });
        let calls = 0;

        await Promise.all(
          [1, 2, 3, 4, 5].map(async () => {
            await limiter.limit(async () => {
              calls = calls + 1;
              await sleep(100);
            });
          })
        );
        expect(calls).toEqual(5);
      });
    });

    describe("AND using the drop setting", () => {
      test("Some calls are dropped", async () => {
        const limiter = new LiveLimit({
          maxLive: 2,
          maxReached: MaxReachedBehavior.Drop,
        });
        let calls = 0;

        await Promise.all(
          [1, 2, 3, 4, 5].map(async () => {
            await limiter.limit(async () => {
              calls = calls + 1;
              await sleep(100);
            });
          })
        );
        expect(calls).toBeLessThan(5);
      });

      test("Dropped calls return null", async () => {
        const limiter = new LiveLimit({
          maxLive: 2,
          maxReached: MaxReachedBehavior.Drop,
        });

        const returned = await Promise.all(
          [1, 2, 3, 4, 5].map(() => {
            return limiter.limit(async () => {
              await sleep(100);
              return "yes!";
            });
          })
        );
        expect(returned).toEqual(expect.arrayContaining([null, "yes!"]));
      });
    });
  });

  describe("AND one of the calls rejects", () => {
    describe("AND using default settings", () => {
      test("Rejects once all are resolved or rejected", async () => {
        const limiter = new LiveLimit({ maxLive: 3 });
        let calls = 0;

        await Promise.allSettled(
          [1, 2, 3, 4, 5].map(async () => {
            await limiter.limit(async () => {
              calls = calls + 1;
              await sleep(100);
              if (calls === 2) throw "err";
            });
          })
        );
        expect(calls).toEqual(5);
      });
    });
  });

  describe("AND all calls reject", () => {
    describe("AND using default settings", () => {
      test("Rejects once all are rejected", async () => {
        const limiter = new LiveLimit({ maxLive: 3 });
        let calls = 0;

        await Promise.allSettled(
          [1, 2, 3, 4, 5].map(async () => {
            await limiter.limit(async () => {
              calls = calls + 1;
              await sleep(100);
              throw "err";
            });
          })
        );
        expect(calls).toEqual(5);
      });
    });
  });
});
