import {DEFAULT_POLLING_INTERVAL_IN_MILLISECONDS} from '../constants/core.constants';
import {
  ICRC25_PERMISSIONS,
  ICRC25_REQUEST_PERMISSIONS,
  ICRC25_SUPPORTED_STANDARDS,
  ICRC27_ACCOUNTS,
  ICRC29_STATUS,
  ICRC49_CALL_CANISTER
} from '../constants/icrc.constants';
import {mockCallCanisterParams} from '../mocks/call-canister.mocks';
import type {IcrcAnyRequestedScopes} from '../types/icrc-requests';
import {JSON_RPC_VERSION_2} from '../types/rpc';
import type {ReadyOrError} from '../utils/timeout.utils';
import {
  permissions,
  requestAccounts,
  requestCallCanister,
  requestPermissions,
  requestStatus,
  requestSupportedStandards,
  retryRequestStatus
} from './relying-party.handlers';

describe('Relying Party handlers', () => {
  const testId = crypto.randomUUID();
  const testOrigin = 'https://hello.com';

  let popup: Window;
  let isReady: () => ReadyOrError | 'pending';

  const focusMock = vi.fn();
  const postMessageMock = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();

    popup = {
      focus: focusMock,
      postMessage: postMessageMock
    } as unknown as Window;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('retryRequestStatus', () => {
    describe('Success', () => {
      beforeEach(() => {
        let counter = 0;
        isReady = vi.fn(() => {
          counter++;
          return counter > 1 ? 'ready' : 'pending';
        });
      });

      it('should call icrc29_status postMessage and returns ready', () =>
        // eslint-disable-next-line @typescript-eslint/return-await
        new Promise<void>((resolve) => {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          retryRequestStatus({popup, isReady, timeoutInMilliseconds: 120000, id: testId}).then(
            (result) => {
              // eslint-disable-next-line @typescript-eslint/unbound-method
              expect(postMessageMock).toHaveBeenCalledWith(
                {
                  id: testId,
                  jsonrpc: '2.0',
                  method: 'icrc29_status'
                },
                '*'
              );

              expect(result).toEqual('ready');

              resolve();
            }
          );

          vi.advanceTimersByTime(1000);
        }));
    });

    describe('Pending', () => {
      beforeEach(() => {
        isReady = vi.fn(() => 'pending' as ReadyOrError | 'pending');
      });

      it('should timeout after 30 seconds', () =>
        // eslint-disable-next-line @typescript-eslint/return-await, no-async-promise-executor, @typescript-eslint/no-misused-promises
        new Promise<void>(async (resolve) => {
          const retries = (30 * 1000) / DEFAULT_POLLING_INTERVAL_IN_MILLISECONDS;

          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          retryRequestStatus({popup, isReady, timeoutInMilliseconds: 30000, id: testId}).then(
            (result) => {
              expect(result).toEqual('timeout');

              resolve();
            }
          );

          await vi.advanceTimersByTimeAsync(retries * DEFAULT_POLLING_INTERVAL_IN_MILLISECONDS);
        }));

      it('should poll ready function', () =>
        // eslint-disable-next-line @typescript-eslint/return-await, no-async-promise-executor, @typescript-eslint/no-misused-promises
        new Promise<void>(async (resolve) => {
          const retries = (30 * 1000) / DEFAULT_POLLING_INTERVAL_IN_MILLISECONDS;

          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          retryRequestStatus({popup, isReady, timeoutInMilliseconds: 30000, id: testId}).then(
            () => {
              expect(isReady).toHaveBeenCalledTimes(retries);

              resolve();
            }
          );

          await vi.advanceTimersByTimeAsync(retries * DEFAULT_POLLING_INTERVAL_IN_MILLISECONDS);
        }));
    });

    it('should not bring the popup in front with focus', () =>
      // eslint-disable-next-line @typescript-eslint/return-await, no-async-promise-executor, @typescript-eslint/no-misused-promises
      new Promise<void>(async (resolve) => {
        const retries = (30 * 1000) / DEFAULT_POLLING_INTERVAL_IN_MILLISECONDS;

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        retryRequestStatus({popup, isReady, timeoutInMilliseconds: 30000, id: testId}).then(() => {
          expect(focusMock).not.toHaveBeenCalled();

          resolve();
        });

        await vi.advanceTimersByTimeAsync(retries * DEFAULT_POLLING_INTERVAL_IN_MILLISECONDS);
      }));
  });

  describe('Request status', () => {
    it('should send the correct message to the popup', () => {
      requestStatus({id: testId, popup, origin: testOrigin});

      expect(postMessageMock).toHaveBeenCalledWith(
        {
          jsonrpc: JSON_RPC_VERSION_2,
          id: testId,
          method: ICRC29_STATUS
        },
        testOrigin
      );
    });

    it('should not bring the popup in front with focus', () => {
      requestStatus({id: testId, popup, origin: testOrigin});

      expect(focusMock).not.toHaveBeenCalled();
    });
  });

  describe('Supported standards', () => {
    it('should send the correct message to the popup', () => {
      requestSupportedStandards({id: testId, popup, origin: testOrigin});

      expect(postMessageMock).toHaveBeenCalledWith(
        {
          jsonrpc: JSON_RPC_VERSION_2,
          id: testId,
          method: ICRC25_SUPPORTED_STANDARDS
        },
        testOrigin
      );
    });

    it('should not bring the popup in front with focus', () => {
      requestSupportedStandards({id: testId, popup, origin: testOrigin});

      expect(focusMock).not.toHaveBeenCalled();
    });
  });

  describe('Query permissions', () => {
    it('should send the correct message to the popup', () => {
      permissions({id: testId, popup, origin: testOrigin});

      expect(postMessageMock).toHaveBeenCalledWith(
        {
          jsonrpc: JSON_RPC_VERSION_2,
          id: testId,
          method: ICRC25_PERMISSIONS
        },
        testOrigin
      );
    });

    it('should not bring the popup in front with focus', () => {
      permissions({id: testId, popup, origin: testOrigin});

      expect(focusMock).not.toHaveBeenCalled();
    });
  });

  describe('Request permissions', () => {
    const params: IcrcAnyRequestedScopes = {
      scopes: [
        {
          method: ICRC27_ACCOUNTS
        }
      ]
    };

    it('should send the correct message to the popup', () => {
      requestPermissions({id: testId, popup, origin: testOrigin, params});

      expect(postMessageMock).toHaveBeenCalledWith(
        {
          jsonrpc: JSON_RPC_VERSION_2,
          id: testId,
          method: ICRC25_REQUEST_PERMISSIONS,
          params
        },
        testOrigin
      );
    });

    it('should bring the popup in front with focus', () => {
      requestPermissions({id: testId, popup, origin: testOrigin, params});

      expect(focusMock).toHaveBeenCalledOnce();
    });
  });

  describe('Request accounts', () => {
    it('should send the correct message to the popup', () => {
      requestAccounts({id: testId, popup, origin: testOrigin});

      expect(postMessageMock).toHaveBeenCalledWith(
        {
          jsonrpc: JSON_RPC_VERSION_2,
          id: testId,
          method: ICRC27_ACCOUNTS
        },
        testOrigin
      );
    });

    it('should bring the popup in front with focus', () => {
      requestAccounts({id: testId, popup, origin: testOrigin});

      expect(focusMock).toHaveBeenCalledOnce();
    });
  });

  describe('Request accounts', () => {
    it('should send the correct message to the popup', () => {
      requestCallCanister({id: testId, popup, origin: testOrigin, params: mockCallCanisterParams});

      expect(postMessageMock).toHaveBeenCalledWith(
        {
          jsonrpc: JSON_RPC_VERSION_2,
          id: testId,
          method: ICRC49_CALL_CANISTER,
          params: mockCallCanisterParams
        },
        testOrigin
      );
    });

    it('should bring the popup in front with focus', () => {
      requestCallCanister({id: testId, popup, origin: testOrigin, params: mockCallCanisterParams});

      expect(focusMock).toHaveBeenCalledOnce();
    });
  });
});
