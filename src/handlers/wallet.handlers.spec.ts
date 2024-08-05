import {ReadyOrError} from '../utils/timeout.utils';
import {retryRequestStatus} from './wallet.handlers';

describe('Wallet handlers', () => {
  const testId = '1234_test';

  let popup: Window;
  let isReady: () => ReadyOrError | 'pending';

  beforeEach(() => {
    vi.useFakeTimers();

    popup = {
      postMessage: vi.fn()
    } as unknown as Window;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Success', () => {
    beforeEach(() => {
      let counter = 0;
      isReady = vi.fn(() => {
        counter++;
        return counter > 1 ? 'ready' : 'pending';
      });
    });

    it('should call icrc29_status postMessage and returns ready', async () =>
      // eslint-disable-next-line @typescript-eslint/return-await
      new Promise<void>((resolve) => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        retryRequestStatus({popup, isReady, id: testId}).then((result) => {
          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(popup.postMessage).toHaveBeenCalledWith(
            {
              id: testId,
              jsonrpc: '2.0',
              method: 'icrc29_status'
            },
            '*'
          );

          expect(result).toEqual('ready');

          resolve();
        });

        vi.advanceTimersByTime(1000);
      }));
  });

  describe('Failure', () => {
    beforeEach(() => {
      isReady = vi.fn(() => 'pending');
    });

    it('should timeout after 30 seconds', async () =>
      // eslint-disable-next-line @typescript-eslint/return-await, no-async-promise-executor, @typescript-eslint/no-misused-promises
      new Promise<void>(async (resolve) => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        retryRequestStatus({popup, isReady, id: testId}).then((result) => {
          expect(result).toEqual('timeout');

          resolve();
        });

        await vi.advanceTimersByTimeAsync(60 * 500);
      }));
  });
});
