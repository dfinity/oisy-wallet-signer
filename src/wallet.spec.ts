import {describe} from 'vitest';
import * as walletHandlers from './handlers/wallet.handlers';
import {ICRC29_STATUS} from './types/icrc';
import {JSON_RPC_VERSION_2, RpcResponseWithResultOrError} from './types/rpc';
import type {WalletOptions} from './types/wallet';
import {WALLET_WINDOW_CENTER, WALLET_WINDOW_TOP_RIGHT, windowFeatures} from './utils/window.utils';
import {Wallet} from './wallet';

describe('Wallet', () => {
  const mockParameters: WalletOptions = {url: 'https://test.com'};

  const messageEventReady = new MessageEvent('message', {
    origin: mockParameters.url,
    data: {
      jsonrpc: JSON_RPC_VERSION_2,
      id: '123',
      result: 'ready'
    }
  });

  let originalOpen: typeof window.open;

  describe('Window success', () => {
    beforeEach(() => {
      originalOpen = window.open;

      vi.stubGlobal(
        'open',
        vi.fn(() => window)
      );
      vi.stubGlobal('close', vi.fn());
    });

    afterEach(() => {
      window.open = originalOpen;

      vi.restoreAllMocks();
    });

    describe('Connection errors', () => {
      it('should throw connection timeout error', async () => {
        vi.spyOn(walletHandlers, 'retryRequestStatus').mockResolvedValue('timeout');

        await expect(Wallet.connect(mockParameters)).rejects.toThrow(
          'Connection timeout. Unable to connect to the wallet.'
        );
      });

      it('should assert edge case wallet not defined but request status success', async () => {
        vi.spyOn(walletHandlers, 'retryRequestStatus').mockResolvedValue('ready');

        await expect(Wallet.connect(mockParameters)).rejects.toThrow(
          'Unexpected error. The request status succeeded, but the wallet response is not defined.'
        );
      });

      it('should throw error if the message ready received comes from another origin', async () => {
        const hackerOrigin = 'https://hacker.com';

        const promise = Wallet.connect(mockParameters);

        const messageEvent = new MessageEvent('message', {
          origin: hackerOrigin,
          data: {
            jsonrpc: JSON_RPC_VERSION_2,
            id: '123',
            result: 'ready'
          }
        });

        window.dispatchEvent(messageEvent);

        await expect(promise).rejects.toThrow(
          `The response origin ${hackerOrigin} does not match the requested wallet URL ${mockParameters.url}.`
        );
      });

      it('should throw error if the wallet options are not well formatted', async () => {
        const incorrectOrigin = 'test';

        await expect(Wallet.connect({url: incorrectOrigin})).rejects.toThrow(
          'Wallet options cannot be parsed:'
        );
      });
    });

    describe('Connection success', () => {
      const options = [
        {
          title: 'default options',
          params: mockParameters,
          expectedOptions: windowFeatures(WALLET_WINDOW_TOP_RIGHT)
        },
        {
          title: 'centered window',
          params: {
            ...mockParameters,
            windowOptions: WALLET_WINDOW_CENTER
          },
          expectedOptions: windowFeatures(WALLET_WINDOW_CENTER)
        },
        {
          title: 'custom window',
          params: {
            ...mockParameters,
            windowOptions: 'height=600, width=400'
          },
          expectedOptions: 'height=600, width=400'
        }
      ];

      it.each(options)('$title', async ({params, expectedOptions}) => {
        const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
        const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

        const promise = Wallet.connect(params);

        window.dispatchEvent(messageEventReady);

        const wallet = await promise;

        expect(wallet).toBeInstanceOf(Wallet);

        expect(window.open).toHaveBeenCalledWith(
          mockParameters.url,
          'walletWindow',
          expectedOptions
        );
        expect(window.open).toHaveBeenCalledTimes(1);

        expect(addEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
        expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
      });

      it('should not process message which are not RpcResponse', async () => {
        const safeParseSpy = vi.spyOn(RpcResponseWithResultOrError, 'safeParse');

        const promise = Wallet.connect(mockParameters);

        const messageEventNotRpc = new MessageEvent('message', {
          data: 'test',
          origin: mockParameters.url
        });

        window.dispatchEvent(messageEventNotRpc);

        window.dispatchEvent(messageEventReady);

        const wallet = await promise;

        expect(wallet).toBeInstanceOf(Wallet);

        // Two responses as triggered above
        expect(safeParseSpy).toHaveBeenCalledWith(messageEventNotRpc.data);
        expect(safeParseSpy).toHaveBeenCalledWith(messageEventReady.data);

        // We are mocking the popup with the window, therefore popup.postMessage({method: ICRC29_STATUS}) results in an additional message detected by window.addEventListener
        expect(safeParseSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            method: ICRC29_STATUS
          })
        );

        expect(safeParseSpy).toHaveBeenCalledTimes(3);
      });

      it('should not close popup on connection success', async () => {
        const promise = Wallet.connect(mockParameters);

        window.dispatchEvent(messageEventReady);

        const wallet = await promise;

        expect(wallet).toBeInstanceOf(Wallet);

        expect(window.open).toHaveBeenCalledTimes(1);
        expect(window.close).not.toHaveBeenCalled();
      });

      it('should close popup on connection not successful', async () =>
        // eslint-disable-next-line @typescript-eslint/return-await, no-async-promise-executor, @typescript-eslint/no-misused-promises
        new Promise<void>(async (resolve) => {
          vi.useFakeTimers();

          Wallet.connect(mockParameters).catch((err: Error) => {
            expect(err.message).toBe('Connection timeout. Unable to connect to the wallet.');

            expect(window.open).toHaveBeenCalledTimes(1);
            expect(window.close).toHaveBeenCalledTimes(1);

            vi.useRealTimers();

            resolve();
          });

          await vi.advanceTimersByTimeAsync(2 * 60 * 1000);
        }));
    });

    describe('Disconnect', () => {
      it('should close popup on disconnect', async () => {
        const promise = Wallet.connect(mockParameters);

        window.dispatchEvent(messageEventReady);

        const {disconnect} = await promise;

        expect(window.open).toHaveBeenCalledTimes(1);
        expect(window.close).not.toHaveBeenCalled();

        await disconnect();

        expect(window.close).toHaveBeenCalled();
      });
    });
  });

  describe('Window failure', () => {
    beforeEach(() => {
      originalOpen = window.open;

      vi.stubGlobal(
        'open',
        vi.fn(() => undefined)
      );
      vi.stubGlobal('close', vi.fn());
    });

    afterEach(() => {
      window.open = originalOpen;

      vi.restoreAllMocks();
    });

    it('should throw cannot open window', async () => {
      await expect(Wallet.connect(mockParameters)).rejects.toThrow(
        'Unable to open the wallet window.'
      );
    });
  });
});
