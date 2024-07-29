export const waitForMilliseconds = async (milliseconds: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
};

export const retryUntilReady = async ({
  retries,
  isReady,
  fn,
  intervalInMs = 500
}: {
  retries: number;
  isReady: () => boolean;
  fn: () => void;
  intervalInMs?: number;
}): Promise<'ready' | 'timeout'> => {
  const ready = isReady();

  if (ready) {
    return 'ready';
  }

  const remainingRetries = retries - 1;

  if (remainingRetries === 0) {
    return 'timeout';
  }

  fn();

  await waitForMilliseconds(intervalInMs);

  return await retryUntilReady({retries: remainingRetries, isReady, fn});
};
