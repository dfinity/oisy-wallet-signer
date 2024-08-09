import {ICRC25_SUPPORTED_STANDARDS, ICRC29_STATUS} from './constants/icrc.constants';
import {WALLET_CONNECT_TIMEOUT_REQUEST_SUPPORTED_STANDARD} from './constants/wallet.constants';
import * as walletHandlers from './handlers/wallet.handlers';
import {IcrcSupportedStandardsResponseSchema} from './types/icrc-responses';
import {JSON_RPC_VERSION_2, RpcResponseWithResultOrErrorSchema} from './types/rpc';
import type {WalletOptions} from './types/wallet-options';
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

    describe('Connect', () => {
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

        it('should call the wallet to poll for status', async () => {
          const spy = vi.spyOn(walletHandlers, 'retryRequestStatus');
          const spyPostMessage = vi.spyOn(window, 'postMessage');

          const promise = Wallet.connect(mockParameters);

          expect(spy).toHaveBeenCalledTimes(1);

          expect(spyPostMessage).toHaveBeenCalledWith(
            expect.objectContaining({
              jsonrpc: JSON_RPC_VERSION_2,
              method: ICRC29_STATUS
            }),
            '*'
          );

          // Consume promise to clean-up internal listener
          window.dispatchEvent(messageEventReady);
          await promise;
        });

        it('should not process message which are not RpcResponse', async () => {
          const safeParseSpy = vi.spyOn(RpcResponseWithResultOrErrorSchema, 'safeParse');

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

    describe('Supported standards', () => {
      let wallet: Wallet;

      const supportedStandards = [
        {
          name: 'ICRC-25',
          url: 'https://github.com/dfinity/ICRC/blob/main/ICRCs/ICRC-25/ICRC-25.md'
        }
      ];

      beforeEach(async () => {
        const promise = Wallet.connect(mockParameters);

        window.dispatchEvent(messageEventReady);

        wallet = await promise;
      });

      afterEach(async () => {
        await wallet.disconnect();
      });

      describe('Request errors', () => {
        it('should throw error if the wallet request options are not well formatted', async () => {
          // @ts-expect-error: we are testing this on purpose
          await expect(wallet.supportedStandards({timeoutInMilliseconds: 'test'})).rejects.toThrow(
            'Wallet request options cannot be parsed:'
          );
        });

        const options = [
          {
            title: 'default options'
          },
          {
            title: 'custom timeout',
            options: {timeoutInMilliseconds: 20000}
          }
        ];

        it.each(options)(
          'should timeout for $title if wallet does not answer with expected standards',
          async ({options}) => {
            // eslint-disable-next-line @typescript-eslint/return-await, no-async-promise-executor, @typescript-eslint/no-misused-promises
            return new Promise<void>(async (resolve) => {
              vi.useFakeTimers();

              const timeout =
                options?.timeoutInMilliseconds ?? WALLET_CONNECT_TIMEOUT_REQUEST_SUPPORTED_STANDARD;

              wallet.supportedStandards(options).catch((err: Error) => {
                expect(err.message).toBe(
                  `Supported standards request to wallet timed out after ${timeout} milliseconds.`
                );

                vi.useRealTimers();

                resolve();
              });

              await vi.advanceTimersByTimeAsync(timeout);
            });
          }
        );

        it('should timeout if response ID is not the same as requst ID', async () => {
          // eslint-disable-next-line @typescript-eslint/return-await, no-async-promise-executor, @typescript-eslint/no-misused-promises
          return new Promise<void>(async (resolve) => {
            vi.useFakeTimers();

            const spy = vi.spyOn(IcrcSupportedStandardsResponseSchema, 'safeParse');

            wallet.supportedStandards().catch((err: Error) => {
              expect(err.message).toBe(
                `Supported standards request to wallet timed out after ${WALLET_CONNECT_TIMEOUT_REQUEST_SUPPORTED_STANDARD} milliseconds.`
              );

              expect(spy).toHaveBeenCalledTimes(1);

              vi.useRealTimers();

              resolve();
            });

            const messageEventSupportedStandards = new MessageEvent('message', {
              origin: mockParameters.url,
              data: {
                jsonrpc: JSON_RPC_VERSION_2,
                id: '123',
                result: {
                  supportedStandards
                }
              }
            });

            window.dispatchEvent(messageEventSupportedStandards);

            await vi.advanceTimersByTimeAsync(WALLET_CONNECT_TIMEOUT_REQUEST_SUPPORTED_STANDARD);
          });
        });

        it('should throw error if the message signer standards received comes from another origin', async () => {
          const hackerOrigin = 'https://hacker.com';

          const promise = wallet.supportedStandards();

          const messageEvent = new MessageEvent('message', {
            origin: hackerOrigin,
            data: {
              jsonrpc: JSON_RPC_VERSION_2,
              id: '123',
              result: {
                supportedStandards
              }
            }
          });

          window.dispatchEvent(messageEvent);

          await expect(promise).rejects.toThrow(
            `The response origin ${hackerOrigin} does not match the wallet origin ${mockParameters.url}.`
          );
        });
      });

      describe('Request success', () => {
        it('should call the wallet with postMessage', async () => {
          const spy = vi.spyOn(walletHandlers, 'requestSupportedStandards');
          const spyPostMessage = vi.spyOn(window, 'postMessage');

          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          wallet.supportedStandards();

          expect(spy).toHaveBeenCalledTimes(1);
          expect(spyPostMessage).toHaveBeenCalledTimes(1);

          expect(spyPostMessage).toHaveBeenCalledWith(
            expect.objectContaining({
              jsonrpc: JSON_RPC_VERSION_2,
              method: ICRC25_SUPPORTED_STANDARDS
            }),
            mockParameters.url
          );
        });
      });

      it('should respond with the supported standards', async () => {
        const requestId = '12345';

        const promise = wallet.supportedStandards({requestId});

        const messageEventSupportedStandards = new MessageEvent('message', {
          origin: mockParameters.url,
          data: {
            jsonrpc: JSON_RPC_VERSION_2,
            id: requestId,
            result: {
              supportedStandards
            }
          }
        });

        window.dispatchEvent(messageEventSupportedStandards);

        const result = await promise;

        expect(result).toEqual(supportedStandards);
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
