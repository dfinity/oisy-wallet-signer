export const waitForMilliseconds = async (milliseconds: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
};

export type ReadyOrError = 'ready' | 'error';

export const retryUntilReady = async ({
  retries,
  isReady,
  fn,
  intervalInMs = 500
}: {
  retries: number;
  isReady: () => ReadyOrError | 'pending';
  fn: () => void;
  intervalInMs?: number;
}): Promise<ReadyOrError | 'timeout'> => {
  const ready = isReady();

  if (ready !== 'pending') {
    return ready;
  }

  const remainingRetries = retries - 1;

  if (remainingRetries === 0) {
    return 'timeout';
  }

  fn();

  await waitForMilliseconds(intervalInMs);

  return await retryUntilReady({retries: remainingRetries, intervalInMs, isReady, fn});
};
