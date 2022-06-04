/** The behavior to follow when the {@link LiveLimitConfig.maxLive} limit is hit. */
export enum MaxReachedBehavior {
  /** Additional calls are queued, and will be executed when spots become available. */
  Queue = "Queue",
  /** Additional calls are dropped. They won't be executed even if spots become available. */
  Drop = "Drop",
}

/** The configuration used to set up the live limiter. */
export type LiveLimitConfig = {
  // The maximum number of calls that can be live at the same time.
  //
  // Once this number is reached, additional calls are queued or dropped based on the {@link LiveLimitConfig.maxReached} setting.
  //
  maxLive: number;
  // How to handle additional calls once {@link LiveLimitConfig.maxLive} is reached.
  //
  // This is {@link MaxReachedBehavior.Queue} by default, meaning that additional calls are queued and will wait to execute.
  //
  maxReached?: MaxReachedBehavior;
};

// The limiter.
//
// You likely want to create your limiter as a global to ensure that all
// operations will share the same limiter and will respect the limit.
//
// Limitations: You can only queue up to $2^(54) - 1$ many calls at a time (over
// 18 quadrillion). Additional calls may cause some queued calls to be dropped.
//
/**
 *
 */
export class LiveLimit {
  private config: Required<LiveLimitConfig>;
  // A map of in-progress requests. The key is a randomly generated ID number,
  // like an auto-incrementing database key.
  private inProgress: Map<number, Promise<unknown>> = new Map();

  private lastId: number = Number.MIN_SAFE_INTEGER;

  /**
   * @param config The configuration to use.
   */
  constructor(config: LiveLimitConfig) {
    if (config.maxLive <= 0 || !Number.isInteger(config.maxLive)) {
      throw {
        error:
          "LiveLimitConfig: Bad configuration: `maxLive` must be a positive integer.",
      };
    }
    this.config = {
      maxReached: MaxReachedBehavior.Queue,
      ...config,
    };
  }

  /**
   * Calls the function when a spot is open based on the limiter rules.
   *
   * The returned promise is resolved:
   * - When the function is executed and the promise returned by the function
   *    resolves
   * - If {@link LiveLimitConfig.maxReached} is {@link MaxReachedBehavior.Drop},
   *    when the function call is dropped.
   *
   * Accepts no arguments, you should use closures to pass parameters to the
   * function. For example:
   *
   * ```ts
   * // Setup
   * const LIMITER = new LiveLimit({ maxLive: 3 });
   * async function myFunc(n: number) {
   *    // ... use n here ...
   * }
   *
   * // Usage
   * const param = 1;
   * LIMITER.limit(async () => {
   *    await myFunc(param);
   * });
   * // Usage when you have many calls to make at once
   * const params = [1, 2, 3, 4, 5, 6];
   * params.forEach((param) => {
   *    LIMITER.limit(async () => {
   *      myFunc(param);
   *    });
   * });
   * ```
   *
   * @param fn The function to execute.
   */
  public async limit(fn: () => Promise<unknown>): Promise<void> {
    const key = this.lastId;

    if (this.lastId + 1 < Number.MAX_SAFE_INTEGER) {
      this.lastId = this.lastId + 1;
    } else {
      this.lastId = Number.MIN_SAFE_INTEGER;
    }

    if (this.inProgress.size >= this.config.maxLive && this.config.maxReached === MaxReachedBehavior.Drop) {
      return;
    }

    // Wait until a slot is available for this call. This is in a loop because
    // multiple "threads" may wake up at the same time, in which case some may
    // need to go back to waiting.
    while (this.inProgress.size >= this.config.maxLive) {
      await Promise.any(this.inProgress.values());
    }

    try {
      const promise = fn();

      this.inProgress.set(key, promise);
      await promise;
    } finally {
      this.inProgress.delete(key);
    }
  }
}
