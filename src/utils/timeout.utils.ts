import {DEFAULT_POLLING_INTERVAL_IN_MILLISECONDS} from '../constants/core.constants';

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
  intervalInMilliseconds = DEFAULT_POLLING_INTERVAL_IN_MILLISECONDS
}: {
  retries: number;
  isReady: () => ReadyOrError | 'pending';
  fn: () => void;
  intervalInMilliseconds?: number;
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

  await waitForMilliseconds(intervalInMilliseconds);

  return await retryUntilReady({retries: remainingRetries, intervalInMilliseconds, isReady, fn});
};
