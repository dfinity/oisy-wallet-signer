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

    it('should call icrc29_status postMessage and returns ready', () =>
      new Promise<void>((done) => {
        retryRequestStatus({popup, isReady, msgId: '123'}).then((result) => {
          expect(popup.postMessage).toHaveBeenCalledWith(
            {
              id: '123',
              jsonrpc: '2.0',
              method: 'icrc29_status'
            },
            '*'
          );

          expect(result).toEqual('ready');

          done();
        });

        vi.advanceTimersByTime(1000);
      }));
  });

  describe('Failure', () => {
    beforeEach(() => {
      isReady = vi.fn(() => false);
    });

    it('should timeout after 30 seconds', () =>
      new Promise<void>(async (done) => {
        retryRequestStatus({popup, isReady, msgId: '123'}).then((result) => {
          expect(result).toEqual('timeout');

          done();
        });

        for (const _ of [...Array(59).keys()]) {
          await vi.advanceTimersByTimeAsync(500);
        }
      }));
  });
});
