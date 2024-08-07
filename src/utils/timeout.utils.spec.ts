import {retryUntilReady, waitForMilliseconds, type ReadyOrError} from './timeout.utils';

describe('waitForMilliseconds', () => {
  it('should wait for the specified milliseconds', async () => {
    vi.useFakeTimers();

    const waitTime = 5000;

    const promise = waitForMilliseconds(waitTime);

    vi.advanceTimersByTime(waitTime);

    await promise;

    expect(vi.getTimerCount()).toBe(0);

    vi.useRealTimers();
  });
});

describe('retryUntilReady', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "ready" if isReady returns "ready" initially', async () => {
    const isReady: () => ReadyOrError | 'pending' = vi.fn(() => 'ready');
    const fn = vi.fn();

    const result = await retryUntilReady({retries: 3, isReady, fn});

    expect(result).toBe('ready');
    expect(isReady).toHaveBeenCalledTimes(1);
    expect(fn).not.toHaveBeenCalled();
  });

  it('should return "error" if isReady returns "error" initially', async () => {
    const isReady: () => ReadyOrError | 'pending' = vi.fn(() => 'error');
    const fn = vi.fn();

    const result = await retryUntilReady({retries: 3, isReady, fn});

    expect(result).toBe('error');
    expect(isReady).toHaveBeenCalledTimes(1);
    expect(fn).not.toHaveBeenCalled();
  });

  it('should retry the specified number of times and return "timeout" if not ready', async () => {
    let counter = 0;
    const isReady: () => ReadyOrError | 'pending' = vi.fn(() =>
      counter >= 3 ? 'ready' : 'pending'
    );
    const fn = vi.fn(() => {
      counter++;
    });

    const promise = retryUntilReady({retries: 3, isReady, fn});

    await vi.advanceTimersByTimeAsync(1500);

    const result = await promise;

    expect(result).toBe('timeout');
    expect(isReady).toHaveBeenCalledTimes(3);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should retry and eventually return "ready" when isReady returns "ready" within the retry limit', async () => {
    let counter = 0;
    const isReady: () => ReadyOrError | 'pending' = vi.fn(() =>
      counter >= 2 ? 'ready' : 'pending'
    );
    const fn = vi.fn(() => {
      counter++;
    });

    const promise = retryUntilReady({retries: 5, isReady, fn});

    await vi.advanceTimersByTimeAsync(1000);

    const result = await promise;

    expect(result).toBe('ready');
    expect(isReady).toHaveBeenCalledTimes(3);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should respect the interval between retries', async () => {
    let counter = 0;
    const intervalInMs = 100;
    const isReady: () => ReadyOrError | 'pending' = vi.fn(() =>
      counter >= 2 ? 'ready' : 'pending'
    );
    const fn = vi.fn(() => {
      counter++;
    });

    const promise = retryUntilReady({
      retries: 3,
      isReady,
      fn,
      intervalInMilliseconds: intervalInMs
    });

    await vi.advanceTimersByTimeAsync(intervalInMs * 2);

    await promise;

    expect(isReady).toHaveBeenCalledTimes(3);
  });
});
