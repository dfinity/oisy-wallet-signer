import {retryRequestStatus} from './wallet.handlers';

describe('Wallet handlers', () => {
  let popup: Window;
  let isReady: () => boolean;

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
        return counter > 1;
      });
    });

    it('should call icrc29_status postMessage and returns ready', async () =>
      // eslint-disable-next-line @typescript-eslint/return-await
      new Promise<void>((resolve) => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        retryRequestStatus({popup, isReady, msgId: '123'}).then((result) => {
          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(popup.postMessage).toHaveBeenCalledWith(
            {
              id: '123',
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
      isReady = vi.fn(() => false);
    });

    it('should timeout after 30 seconds', async () =>
      // eslint-disable-next-line @typescript-eslint/return-await, no-async-promise-executor, @typescript-eslint/no-misused-promises
      new Promise<void>(async (resolve) => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        retryRequestStatus({popup, isReady, msgId: '123'}).then((result) => {
          expect(result).toEqual('timeout');

          resolve();
        });

        for (const _ of [...Array(59).keys()]) {
          await vi.advanceTimersByTimeAsync(500);
        }
      }));
  });
});
