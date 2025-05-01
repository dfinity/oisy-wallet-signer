import {uint8ArrayToBase64} from '@dfinity/utils';
import type {MockInstance} from 'vitest';
import {
  ICRC25_PERMISSION_DENIED,
  ICRC25_PERMISSION_GRANTED,
  ICRC25_PERMISSIONS,
  ICRC25_REQUEST_PERMISSIONS,
  ICRC25_SUPPORTED_STANDARDS,
  ICRC27_ACCOUNTS,
  ICRC29_STATUS,
  ICRC49_CALL_CANISTER
} from './constants/icrc.constants';
import {
  RELYING_PARTY_DEFAULT_SCOPES,
  RELYING_PARTY_TIMEOUT_ACCOUNTS,
  RELYING_PARTY_TIMEOUT_CALL_CANISTER,
  RELYING_PARTY_TIMEOUT_PERMISSIONS,
  RELYING_PARTY_TIMEOUT_REQUEST_PERMISSIONS,
  RELYING_PARTY_TIMEOUT_REQUEST_SUPPORTED_STANDARD
} from './constants/relying-party.constants';
import {SignerErrorCode} from './constants/signer.constants';
import {
  DEFAULT_SIGNER_WINDOW_CENTER,
  DEFAULT_SIGNER_WINDOW_TOP_RIGHT
} from './constants/window.constants';
import * as relyingPartyHandlers from './handlers/relying-party.handlers';
import {mockCallCanisterParams} from './mocks/call-canister.mocks';
import {mockAccounts} from './mocks/icrc-accounts.mocks';
import {RelyingParty} from './relying-party';
import type {IcrcAnyRequestedScopes, IcrcCallCanisterRequestParams} from './types/icrc-requests';
import {
  IcrcAccountsResponseSchema,
  IcrcCallCanisterResponseSchema,
  IcrcScopesResponseSchema,
  IcrcSupportedStandardsResponseSchema,
  type IcrcCallCanisterResult
} from './types/icrc-responses';
import type {Origin} from './types/post-message';
import {RelyingPartyResponseError} from './types/relying-party-errors';
import type {OnDisconnect, RelyingPartyOptions} from './types/relying-party-options';
import type {RelyingPartyRequestOptions} from './types/relying-party-requests';
import {JSON_RPC_VERSION_2, RpcResponseWithResultOrErrorSchema} from './types/rpc';
import * as callUtils from './utils/call.utils';
import {windowFeatures} from './utils/window.utils';

describe('Relying Party', () => {
  const mockParameters: RelyingPartyOptions = {url: 'https://test.com'};

  const messageEventReady = new MessageEvent('message', {
    origin: mockParameters.url,
    source: window,
    data: {
      jsonrpc: JSON_RPC_VERSION_2,
      id: crypto.randomUUID(),
      result: 'ready'
    }
  });

  let originalOpen: typeof window.open;
  let originalClose: typeof window.close;

  describe('Window success', () => {
    beforeEach(() => {
      originalOpen = window.open;
      originalClose = window.close;

      vi.stubGlobal(
        'open',
        vi.fn(() => window)
      );
      vi.stubGlobal('close', vi.fn());
      vi.stubGlobal('focus', vi.fn());
    });

    afterEach(() => {
      window.open = originalOpen;
      window.close = originalClose;

      vi.restoreAllMocks();
    });

    describe('Connect', () => {
      describe('Connection errors', () => {
        it('should throw connection timeout error', async () => {
          vi.spyOn(relyingPartyHandlers, 'retryRequestStatus').mockResolvedValue('timeout');

          await expect(RelyingParty.connect(mockParameters)).rejects.toThrow(
            'Connection timeout. Unable to connect to the signer.'
          );
        });

        it('should assert edge case signer not defined but request status success', async () => {
          vi.spyOn(relyingPartyHandlers, 'retryRequestStatus').mockResolvedValue('ready');

          await expect(RelyingParty.connect(mockParameters)).rejects.toThrow(
            'Unexpected error. The request status succeeded, but the signer response is not defined.'
          );
        });

        it('should throw error if the message ready received comes from another origin', async () => {
          const hackerOrigin = 'https://hacker.com';

          const promise = RelyingParty.connect(mockParameters);

          const messageEvent = new MessageEvent('message', {
            origin: hackerOrigin,
            source: window,
            data: {
              jsonrpc: JSON_RPC_VERSION_2,
              id: crypto.randomUUID(),
              result: 'ready'
            }
          });

          window.dispatchEvent(messageEvent);

          await expect(promise).rejects.toThrow(
            `The response origin ${hackerOrigin} does not match the requested signer URL ${mockParameters.url}.`
          );
        });

        it('should throw error if the signer options are not well formatted', async () => {
          const incorrectOrigin = 'test';

          await expect(RelyingParty.connect({url: incorrectOrigin})).rejects.toThrow(
            'Options cannot be parsed:'
          );
        });
      });

      describe('Connection success', () => {
        const options = [
          {
            title: 'default options',
            params: mockParameters,
            expectedOptions: windowFeatures(DEFAULT_SIGNER_WINDOW_TOP_RIGHT)
          },
          {
            title: 'centered window',
            params: {
              ...mockParameters,
              windowOptions: DEFAULT_SIGNER_WINDOW_CENTER
            },
            expectedOptions: windowFeatures(DEFAULT_SIGNER_WINDOW_CENTER)
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

          const promise = RelyingParty.connect(params);

          window.dispatchEvent(messageEventReady);

          const relyingParty = await promise;

          expect(relyingParty).toBeInstanceOf(RelyingParty);

          expect(window.open).toHaveBeenCalledWith(
            mockParameters.url,
            'relyingPartyWindow',
            expectedOptions
          );
          expect(window.open).toHaveBeenCalledOnce();

          expect(addEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
          expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
        });

        it('should call the signer to poll for status', async () => {
          const spy = vi.spyOn(relyingPartyHandlers, 'retryRequestStatus');
          const spyPostMessage = vi.spyOn(window, 'postMessage');

          const promise = RelyingParty.connect(mockParameters);

          expect(spy).toHaveBeenCalledOnce();

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

          const promise = RelyingParty.connect(mockParameters);

          const messageEventNotRpc = new MessageEvent('message', {
            data: 'test',
            source: window,
            origin: mockParameters.url
          });

          window.dispatchEvent(messageEventNotRpc);

          window.dispatchEvent(messageEventReady);

          const relyingParty = await promise;

          expect(relyingParty).toBeInstanceOf(RelyingParty);

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
          const promise = RelyingParty.connect(mockParameters);

          window.dispatchEvent(messageEventReady);

          const relyingParty = await promise;

          expect(relyingParty).toBeInstanceOf(RelyingParty);

          expect(window.open).toHaveBeenCalledOnce();
          expect(window.close).not.toHaveBeenCalled();
        });

        it('should close popup on connection not successful', () =>
          // eslint-disable-next-line no-async-promise-executor
          new Promise<void>(async (resolve) => {
            vi.useFakeTimers();

            RelyingParty.connect(mockParameters).catch((err: Error) => {
              expect(err.message).toBe('Connection timeout. Unable to connect to the signer.');

              expect(window.open).toHaveBeenCalledOnce();
              expect(window.close).toHaveBeenCalledOnce();

              vi.useRealTimers();

              resolve();
            });

            await vi.advanceTimersByTimeAsync(2 * 60 * 1000);
          }));
      });

      describe('Disconnect', () => {
        const connectAndDisconnect = async (onDisconnect?: OnDisconnect) => {
          const promise = RelyingParty.connect({
            ...mockParameters,
            onDisconnect
          });

          window.dispatchEvent(messageEventReady);

          const {disconnect} = await promise;

          expect(window.open).toHaveBeenCalledOnce();
          expect(window.close).not.toHaveBeenCalled();

          await disconnect();
        };

        it('should close popup on disconnect', async () => {
          await connectAndDisconnect();

          expect(window.close).toHaveBeenCalled();
        });

        it('should clear interval on disconnect', async () => {
          const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

          await connectAndDisconnect();

          expect(clearIntervalSpy).toHaveBeenCalledOnce();

          clearIntervalSpy.mockRestore();
        });

        it('should call onDisconnect callback', async () => {
          const spyOnDisconnect = vi.fn();

          await connectAndDisconnect(spyOnDisconnect);

          expect(spyOnDisconnect).toHaveBeenCalledOnce();
        });
      });
    });

    describe('Supported standards', () => {
      let relyingParty: RelyingParty;

      const supportedStandards = [
        {
          name: 'ICRC-25',
          url: 'https://github.com/dfinity/ICRC/blob/main/ICRCs/ICRC-25/ICRC-25.md'
        }
      ];

      beforeEach(async () => {
        const promise = RelyingParty.connect(mockParameters);

        window.dispatchEvent(messageEventReady);

        relyingParty = await promise;
      });

      afterEach(async () => {
        await relyingParty.disconnect();
      });

      describe('Request errors', () => {
        it('should throw error if the relyingParty request options are not well formatted', async () => {
          await expect(
            // @ts-expect-error: we are testing this on purpose
            relyingParty.supportedStandards({options: {timeoutInMilliseconds: 'test'}})
          ).rejects.toThrow('Wallet request options cannot be parsed:');
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
          'should timeout for $title if signer does not answer with expected standards',
          ({options}) =>
            // eslint-disable-next-line no-async-promise-executor
            new Promise<void>(async (resolve) => {
              vi.useFakeTimers();

              const timeout =
                options?.timeoutInMilliseconds ?? RELYING_PARTY_TIMEOUT_REQUEST_SUPPORTED_STANDARD;

              relyingParty.supportedStandards({options}).catch((err: Error) => {
                expect(err.message).toBe(
                  `Request to signer timed out after ${timeout} milliseconds.`
                );

                vi.useRealTimers();

                resolve();
              });

              await vi.advanceTimersByTimeAsync(timeout);
            })
        );

        it('should timeout if response ID is not the same as request ID', () =>
          // eslint-disable-next-line no-async-promise-executor
          new Promise<void>(async (resolve) => {
            vi.useFakeTimers();

            const spy = vi.spyOn(IcrcSupportedStandardsResponseSchema, 'safeParse');

            relyingParty.supportedStandards().catch((err: Error) => {
              expect(err.message).toBe(
                `Request to signer timed out after ${RELYING_PARTY_TIMEOUT_REQUEST_SUPPORTED_STANDARD} milliseconds.`
              );

              expect(spy).toHaveBeenCalledOnce();

              vi.useRealTimers();

              resolve();
            });

            const messageEventSupportedStandards = new MessageEvent('message', {
              origin: mockParameters.url,
              source: window,
              data: {
                jsonrpc: JSON_RPC_VERSION_2,
                id: crypto.randomUUID(),
                result: {
                  supportedStandards
                }
              }
            });

            window.dispatchEvent(messageEventSupportedStandards);

            await vi.advanceTimersByTimeAsync(RELYING_PARTY_TIMEOUT_REQUEST_SUPPORTED_STANDARD);
          }));

        it('should throw error if the message signer standards received comes from another origin', async () => {
          const hackerOrigin = 'https://hacker.com';

          const promise = relyingParty.supportedStandards();

          const messageEvent = new MessageEvent('message', {
            origin: hackerOrigin,
            source: window,
            data: {
              jsonrpc: JSON_RPC_VERSION_2,
              id: crypto.randomUUID(),
              result: {
                supportedStandards
              }
            }
          });

          window.dispatchEvent(messageEvent);

          await expect(promise).rejects.toThrow(
            `The response origin ${hackerOrigin} does not match the signer origin ${mockParameters.url}.`
          );
        });

        it('should throw a response error if the signer notify an error', async () => {
          const testId = crypto.randomUUID();

          const promise = relyingParty.supportedStandards({options: {requestId: testId}});

          const errorMsg = 'This is a test error.';

          const messageEvent = new MessageEvent('message', {
            origin: mockParameters.url,
            source: window,
            data: {
              jsonrpc: JSON_RPC_VERSION_2,
              id: testId,
              error: {
                code: SignerErrorCode.GENERIC_ERROR,
                message: errorMsg
              }
            }
          });

          window.dispatchEvent(messageEvent);

          const error = {
            code: SignerErrorCode.GENERIC_ERROR,
            message: errorMsg
          };

          await expect(promise).rejects.toThrow(new RelyingPartyResponseError(error));
        });

        it('should throw error if the signer popup is closed', async () => {
          const spy = vi.spyOn(window, 'close').mockImplementation(() => {
            // @ts-expect-error: we are testing this on purpose
            this.closed = true;
          });

          window.close();

          await expect(relyingParty.supportedStandards()).rejects.toThrow(
            'The signer has been closed. Your request cannot be processed.'
          );

          spy.mockReset();

          (window as {closed: boolean}).closed = false;
        });
      });

      describe('Request success', () => {
        const requestId = crypto.randomUUID();

        const messagePayload = {
          origin: mockParameters.url,
          source: window,
          data: {
            jsonrpc: JSON_RPC_VERSION_2,
            id: requestId,
            result: {
              supportedStandards
            }
          }
        };

        const messageEventSupportedStandards = new MessageEvent('message', messagePayload);

        it('should call the signer with postMessage', async () => {
          const spy = vi.spyOn(relyingPartyHandlers, 'requestSupportedStandards');
          const spyPostMessage = vi.spyOn(window, 'postMessage');

          const promise = relyingParty.supportedStandards({options: {requestId}});

          window.dispatchEvent(messageEventSupportedStandards);

          await promise;

          expect(spy).toHaveBeenCalledOnce();
          expect(spyPostMessage).toHaveBeenCalledOnce();

          expect(spyPostMessage).toHaveBeenCalledWith(
            expect.objectContaining({
              jsonrpc: JSON_RPC_VERSION_2,
              method: ICRC25_SUPPORTED_STANDARDS
            }),
            mockParameters.url
          );
        });

        it('should respond with the supported standards', async () => {
          const promise = relyingParty.supportedStandards({options: {requestId}});

          window.dispatchEvent(messageEventSupportedStandards);

          const result = await promise;

          expect(result).toEqual(supportedStandards);
        });

        it('should throw an error if the message source is not the opened popup window', async () => {
          const mockHackerWindow = {} as Window;

          const messageEventWithDifferentSource = new MessageEvent('message', {
            ...messagePayload,
            source: mockHackerWindow
          });

          const promise = relyingParty.supportedStandards({options: {requestId}});

          window.dispatchEvent(messageEventWithDifferentSource);

          await expect(async () => await promise).rejects.toThrow(
            'The response is not originating from the window that was opened.'
          );
        });
      });
    });

    describe('Permissions', () => {
      let relyingParty: RelyingParty;

      const scopes = [
        {scope: {method: ICRC27_ACCOUNTS}, state: ICRC25_PERMISSION_GRANTED},
        {scope: {method: ICRC49_CALL_CANISTER}, state: ICRC25_PERMISSION_DENIED}
      ];

      beforeEach(async () => {
        const promise = RelyingParty.connect(mockParameters);

        window.dispatchEvent(messageEventReady);

        relyingParty = await promise;
      });

      afterEach(async () => {
        await relyingParty.disconnect();
      });

      describe('Query', () => {
        describe('Request errors', () => {
          it('should throw error if the signer request options are not well formatted', async () => {
            await expect(
              // @ts-expect-error: we are testing this on purpose
              relyingParty.permissions({options: {timeoutInMilliseconds: 'test'}})
            ).rejects.toThrow('Wallet request options cannot be parsed:');
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
            'should timeout for $title if signer does not answer with expected permissions',
            ({options}) =>
              // eslint-disable-next-line no-async-promise-executor
              new Promise<void>(async (resolve) => {
                vi.useFakeTimers();

                const timeout = options?.timeoutInMilliseconds ?? RELYING_PARTY_TIMEOUT_PERMISSIONS;

                relyingParty.permissions({options}).catch((err: Error) => {
                  expect(err.message).toBe(
                    `Request to signer timed out after ${timeout} milliseconds.`
                  );

                  vi.useRealTimers();

                  resolve();
                });

                await vi.advanceTimersByTimeAsync(timeout);
              })
          );

          it('should timeout if response ID is not the same as request ID', () =>
            // eslint-disable-next-line no-async-promise-executor
            new Promise<void>(async (resolve) => {
              vi.useFakeTimers();

              const spy = vi.spyOn(IcrcScopesResponseSchema, 'safeParse');

              relyingParty.permissions().catch((err: Error) => {
                expect(err.message).toBe(
                  `Request to signer timed out after ${RELYING_PARTY_TIMEOUT_PERMISSIONS} milliseconds.`
                );

                expect(spy).toHaveBeenCalledOnce();

                vi.useRealTimers();

                resolve();
              });

              const messageEventScopes = new MessageEvent('message', {
                origin: mockParameters.url,
                source: window,
                data: {
                  jsonrpc: JSON_RPC_VERSION_2,
                  id: crypto.randomUUID(),
                  result: {
                    scopes
                  }
                }
              });

              window.dispatchEvent(messageEventScopes);

              await vi.advanceTimersByTimeAsync(RELYING_PARTY_TIMEOUT_PERMISSIONS);
            }));

          it('should throw error if the message permissions received comes from another origin', async () => {
            const hackerOrigin = 'https://hacker.com';

            const promise = relyingParty.permissions();

            const messageEvent = new MessageEvent('message', {
              origin: hackerOrigin,
              source: window,
              data: {
                jsonrpc: JSON_RPC_VERSION_2,
                id: crypto.randomUUID(),
                result: {
                  scopes
                }
              }
            });

            window.dispatchEvent(messageEvent);

            await expect(promise).rejects.toThrow(
              `The response origin ${hackerOrigin} does not match the signer origin ${mockParameters.url}.`
            );
          });

          it('should throw a response error if the signer notify an error', async () => {
            const testId = crypto.randomUUID();

            const promise = relyingParty.requestPermissions({options: {requestId: testId}});

            const errorMsg = 'This is a test error.';

            const messageEvent = new MessageEvent('message', {
              origin: mockParameters.url,
              source: window,
              data: {
                jsonrpc: JSON_RPC_VERSION_2,
                id: testId,
                error: {
                  code: SignerErrorCode.GENERIC_ERROR,
                  message: errorMsg
                }
              }
            });

            window.dispatchEvent(messageEvent);

            const error = {
              code: SignerErrorCode.GENERIC_ERROR,
              message: errorMsg
            };

            await expect(promise).rejects.toThrow(new RelyingPartyResponseError(error));
          });

          it('should throw error if the signer popup is closed', async () => {
            const spy = vi.spyOn(window, 'close').mockImplementation(() => {
              // @ts-expect-error: we are testing this on purpose
              this.closed = true;
            });

            window.close();

            await expect(relyingParty.permissions()).rejects.toThrow(
              'The signer has been closed. Your request cannot be processed.'
            );

            spy.mockReset();

            (window as {closed: boolean}).closed = false;
          });
        });

        describe('Request success', () => {
          const requestId = crypto.randomUUID();

          const messagePayload = {
            origin: mockParameters.url,
            source: window,
            data: {
              jsonrpc: JSON_RPC_VERSION_2,
              id: requestId,
              result: {
                scopes
              }
            }
          };

          const messageEventScopes = new MessageEvent('message', messagePayload);

          it('should call the signer with postMessage', async () => {
            const spy = vi.spyOn(relyingPartyHandlers, 'permissions');
            const spyPostMessage = vi.spyOn(window, 'postMessage');

            const promise = relyingParty.permissions({options: {requestId}});

            window.dispatchEvent(messageEventScopes);

            await promise;

            expect(spy).toHaveBeenCalledOnce();
            expect(spyPostMessage).toHaveBeenCalledOnce();

            expect(spyPostMessage).toHaveBeenCalledWith(
              expect.objectContaining({
                jsonrpc: JSON_RPC_VERSION_2,
                method: ICRC25_PERMISSIONS
              }),
              mockParameters.url
            );
          });

          it('should respond with the permissions', async () => {
            const promise = relyingParty.permissions({options: {requestId}});

            window.dispatchEvent(messageEventScopes);

            const result = await promise;

            expect(result).toEqual(scopes);
          });

          it('should throw an error if the message source is not the opened popup window', async () => {
            const mockHackerWindow = {} as Window;

            const messageEventWithDifferentSource = new MessageEvent('message', {
              ...messagePayload,
              source: mockHackerWindow
            });

            const promise = relyingParty.permissions({options: {requestId}});

            window.dispatchEvent(messageEventWithDifferentSource);

            await expect(async () => await promise).rejects.toThrow(
              'The response is not originating from the window that was opened.'
            );
          });
        });
      });

      describe('Request', () => {
        describe('Request errors', () => {
          it('should throw error if the signer request options are not well formatted', async () => {
            await expect(
              // @ts-expect-error: we are testing this on purpose
              relyingParty.requestPermissions({options: {timeoutInMilliseconds: 'test'}})
            ).rejects.toThrow('Wallet request options cannot be parsed:');
          });

          const options = [
            {
              title: 'default options'
            },
            {
              title: 'custom timeout',
              options: {timeoutInMilliseconds: 120000}
            }
          ];

          it.each(options)(
            'should timeout for $title if signer does not answer with expected permissions',
            ({options}) =>
              // eslint-disable-next-line no-async-promise-executor
              new Promise<void>(async (resolve) => {
                vi.useFakeTimers();

                const timeout =
                  options?.timeoutInMilliseconds ?? RELYING_PARTY_TIMEOUT_REQUEST_PERMISSIONS;

                relyingParty.requestPermissions({options}).catch((err: Error) => {
                  expect(err.message).toBe(
                    `Request to signer timed out after ${timeout} milliseconds.`
                  );

                  vi.useRealTimers();

                  resolve();
                });

                await vi.advanceTimersByTimeAsync(timeout);
              })
          );

          it('should timeout if response ID is not the same as request ID', () =>
            // eslint-disable-next-line no-async-promise-executor
            new Promise<void>(async (resolve) => {
              vi.useFakeTimers();

              const spy = vi.spyOn(IcrcScopesResponseSchema, 'safeParse');

              relyingParty.requestPermissions().catch((err: Error) => {
                expect(err.message).toBe(
                  `Request to signer timed out after ${RELYING_PARTY_TIMEOUT_REQUEST_PERMISSIONS} milliseconds.`
                );

                expect(spy).toHaveBeenCalledOnce();

                vi.useRealTimers();

                resolve();
              });

              const messageEventScopes = new MessageEvent('message', {
                origin: mockParameters.url,
                source: window,
                data: {
                  jsonrpc: JSON_RPC_VERSION_2,
                  id: crypto.randomUUID(),
                  result: {
                    scopes
                  }
                }
              });

              window.dispatchEvent(messageEventScopes);

              await vi.advanceTimersByTimeAsync(RELYING_PARTY_TIMEOUT_REQUEST_PERMISSIONS);
            }));

          it('should throw error if the message received comes from another origin', async () => {
            const hackerOrigin = 'https://hacker.com';

            const promise = relyingParty.requestPermissions();

            const messageEvent = new MessageEvent('message', {
              origin: hackerOrigin,
              source: window,
              data: {
                jsonrpc: JSON_RPC_VERSION_2,
                id: crypto.randomUUID(),
                result: {
                  scopes
                }
              }
            });

            window.dispatchEvent(messageEvent);

            await expect(promise).rejects.toThrow(
              `The response origin ${hackerOrigin} does not match the signer origin ${mockParameters.url}.`
            );
          });

          it('should throw a response error if the signer notify an error', async () => {
            const testId = crypto.randomUUID();

            const promise = relyingParty.requestPermissions({options: {requestId: testId}});

            const errorMsg = 'This is a test error.';

            const messageEvent = new MessageEvent('message', {
              origin: mockParameters.url,
              source: window,
              data: {
                jsonrpc: JSON_RPC_VERSION_2,
                id: testId,
                error: {
                  code: SignerErrorCode.GENERIC_ERROR,
                  message: errorMsg
                }
              }
            });

            window.dispatchEvent(messageEvent);

            const error = {
              code: SignerErrorCode.GENERIC_ERROR,
              message: errorMsg
            };

            await expect(promise).rejects.toThrow(new RelyingPartyResponseError(error));
          });

          it('should throw error if the signer popup is closed', async () => {
            const spy = vi.spyOn(window, 'close').mockImplementation(() => {
              // @ts-expect-error: we are testing this on purpose
              this.closed = true;
            });

            window.close();

            await expect(relyingParty.requestPermissions()).rejects.toThrow(
              'The signer has been closed. Your request cannot be processed.'
            );

            spy.mockReset();

            (window as {closed: boolean}).closed = false;
          });
        });

        describe('Request success', () => {
          const requestId = crypto.randomUUID();

          const messagePayload = {
            origin: mockParameters.url,
            source: window,
            data: {
              jsonrpc: JSON_RPC_VERSION_2,
              id: requestId,
              result: {
                scopes
              }
            }
          };

          const messageEventScopes = new MessageEvent('message', messagePayload);

          it('should call the signer with postMessage and default scopes', async () => {
            const spy = vi.spyOn(relyingPartyHandlers, 'requestPermissions');
            const spyPostMessage = vi.spyOn(window, 'postMessage');

            const promise = relyingParty.requestPermissions({options: {requestId}});

            window.dispatchEvent(messageEventScopes);

            await promise;

            expect(spy).toHaveBeenCalledOnce();
            expect(spyPostMessage).toHaveBeenCalledOnce();

            expect(spyPostMessage).toHaveBeenCalledWith(
              expect.objectContaining({
                jsonrpc: JSON_RPC_VERSION_2,
                method: ICRC25_REQUEST_PERMISSIONS,
                params: RELYING_PARTY_DEFAULT_SCOPES
              }),
              mockParameters.url
            );
          });

          it('should call the signer with postMessage selected scopes', async () => {
            const spy = vi.spyOn(relyingPartyHandlers, 'requestPermissions');
            const spyPostMessage = vi.spyOn(window, 'postMessage');

            const selectedScopes: IcrcAnyRequestedScopes = {scopes: [{method: ICRC27_ACCOUNTS}]};

            const promise = relyingParty.requestPermissions({
              options: {requestId},
              params: selectedScopes
            });

            window.dispatchEvent(messageEventScopes);

            await promise;

            expect(spy).toHaveBeenCalledOnce();
            expect(spyPostMessage).toHaveBeenCalledOnce();

            expect(spyPostMessage).toHaveBeenCalledWith(
              expect.objectContaining({
                jsonrpc: JSON_RPC_VERSION_2,
                method: ICRC25_REQUEST_PERMISSIONS,
                params: selectedScopes
              }),
              mockParameters.url
            );
          });

          it('should respond with the selected permissions', async () => {
            const promise = relyingParty.requestPermissions({options: {requestId}});

            window.dispatchEvent(messageEventScopes);

            const result = await promise;

            expect(result).toEqual(scopes);
          });

          it('should throw an error if the message source is not the opened popup window', async () => {
            const mockHackerWindow = {} as Window;

            const messageEventWithDifferentSource = new MessageEvent('message', {
              ...messagePayload,
              source: mockHackerWindow
            });

            const promise = relyingParty.requestPermissions({options: {requestId}});

            window.dispatchEvent(messageEventWithDifferentSource);

            await expect(async () => await promise).rejects.toThrow(
              'The response is not originating from the window that was opened.'
            );
          });
        });
      });
    });

    describe('Accounts', () => {
      let relyingParty: RelyingParty;

      beforeEach(async () => {
        const promise = RelyingParty.connect(mockParameters);

        window.dispatchEvent(messageEventReady);

        relyingParty = await promise;
      });

      afterEach(async () => {
        await relyingParty.disconnect();
      });

      describe('Request errors', () => {
        it('should throw error if the signer request options are not well formatted', async () => {
          await expect(
            // @ts-expect-error: we are testing this on purpose
            relyingParty.accounts({options: {timeoutInMilliseconds: 'test'}})
          ).rejects.toThrow('Wallet request options cannot be parsed:');
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
          'should timeout for $title if signer does not answer with expected accounts',
          ({options}) =>
            // eslint-disable-next-line no-async-promise-executor
            new Promise<void>(async (resolve) => {
              vi.useFakeTimers();

              const timeout = options?.timeoutInMilliseconds ?? RELYING_PARTY_TIMEOUT_ACCOUNTS;

              relyingParty.accounts({options}).catch((err: Error) => {
                expect(err.message).toBe(
                  `Request to signer timed out after ${timeout} milliseconds.`
                );

                vi.useRealTimers();

                resolve();
              });

              await vi.advanceTimersByTimeAsync(timeout);
            })
        );

        it('should timeout if response ID is not the same as request ID', () =>
          // eslint-disable-next-line no-async-promise-executor
          new Promise<void>(async (resolve) => {
            vi.useFakeTimers();

            const spy = vi.spyOn(IcrcAccountsResponseSchema, 'safeParse');

            relyingParty.accounts().catch((err: Error) => {
              expect(err.message).toBe(
                `Request to signer timed out after ${RELYING_PARTY_TIMEOUT_ACCOUNTS} milliseconds.`
              );

              expect(spy).toHaveBeenCalledOnce();

              vi.useRealTimers();

              resolve();
            });

            const messageEventSupportedStandards = new MessageEvent('message', {
              origin: mockParameters.url,
              source: window,
              data: {
                jsonrpc: JSON_RPC_VERSION_2,
                id: crypto.randomUUID(),
                result: {
                  accounts: mockAccounts
                }
              }
            });

            window.dispatchEvent(messageEventSupportedStandards);

            await vi.advanceTimersByTimeAsync(RELYING_PARTY_TIMEOUT_ACCOUNTS);
          }));

        it('should throw error if the message accounts received comes from another origin', async () => {
          const hackerOrigin = 'https://hacker.com';

          const promise = relyingParty.supportedStandards();

          const messageEvent = new MessageEvent('message', {
            origin: hackerOrigin,
            source: window,
            data: {
              jsonrpc: JSON_RPC_VERSION_2,
              id: crypto.randomUUID(),
              result: {
                accounts: mockAccounts
              }
            }
          });

          window.dispatchEvent(messageEvent);

          await expect(promise).rejects.toThrow(
            `The response origin ${hackerOrigin} does not match the signer origin ${mockParameters.url}.`
          );
        });

        it('should throw a response error if the signer notify an error', async () => {
          const testId = crypto.randomUUID();

          const promise = relyingParty.accounts({options: {requestId: testId}});

          const errorMsg = 'This is a test error.';

          const messageEvent = new MessageEvent('message', {
            origin: mockParameters.url,
            source: window,
            data: {
              jsonrpc: JSON_RPC_VERSION_2,
              id: testId,
              error: {
                code: SignerErrorCode.GENERIC_ERROR,
                message: errorMsg
              }
            }
          });

          window.dispatchEvent(messageEvent);

          const error = {
            code: SignerErrorCode.GENERIC_ERROR,
            message: errorMsg
          };

          await expect(promise).rejects.toThrow(new RelyingPartyResponseError(error));
        });

        it('should throw error if the signer popup is closed', async () => {
          const spy = vi.spyOn(window, 'close').mockImplementation(() => {
            // @ts-expect-error: we are testing this on purpose
            this.closed = true;
          });

          window.close();

          await expect(relyingParty.accounts()).rejects.toThrow(
            'The signer has been closed. Your request cannot be processed.'
          );

          spy.mockReset();

          (window as {closed: boolean}).closed = false;
        });
      });

      describe('Request success', () => {
        const requestId = crypto.randomUUID();

        const messagePayload = {
          origin: mockParameters.url,
          source: window,
          data: {
            jsonrpc: JSON_RPC_VERSION_2,
            id: requestId,
            result: {
              accounts: mockAccounts
            }
          }
        };

        const messageEventSupportedStandards = new MessageEvent('message', messagePayload);

        it('should call the signer with postMessage', async () => {
          const spy = vi.spyOn(relyingPartyHandlers, 'requestAccounts');
          const spyPostMessage = vi.spyOn(window, 'postMessage');

          const promise = relyingParty.accounts({options: {requestId}});

          window.dispatchEvent(messageEventSupportedStandards);

          await promise;

          expect(spy).toHaveBeenCalledOnce();
          expect(spyPostMessage).toHaveBeenCalledOnce();

          expect(spyPostMessage).toHaveBeenCalledWith(
            expect.objectContaining({
              jsonrpc: JSON_RPC_VERSION_2,
              method: ICRC27_ACCOUNTS
            }),
            mockParameters.url
          );
        });

        it('should respond with the accounts', async () => {
          const promise = relyingParty.accounts({options: {requestId}});

          window.dispatchEvent(messageEventSupportedStandards);

          const result = await promise;

          expect(result).toEqual(mockAccounts);
        });

        it('should throw an error if the message source is not the opened popup window', async () => {
          const mockHackerWindow = {} as Window;

          const messageEventWithDifferentSource = new MessageEvent('message', {
            ...messagePayload,
            source: mockHackerWindow
          });

          const promise = relyingParty.accounts({options: {requestId}});

          window.dispatchEvent(messageEventWithDifferentSource);

          await expect(async () => await promise).rejects.toThrow(
            'The response is not originating from the window that was opened.'
          );
        });
      });
    });

    describe('Call', () => {
      class TestRelyingParty extends RelyingParty {
        static async connect({
          onDisconnect,
          ...rest
        }: RelyingPartyOptions): Promise<TestRelyingParty> {
          return await this.connectSigner({
            options: rest,
            init: (params: {origin: Origin; popup: Window}) =>
              new TestRelyingParty({
                ...params,
                onDisconnect
              })
          });
        }

        testCall = async (params: {
          options?: RelyingPartyRequestOptions;
          params: IcrcCallCanisterRequestParams;
        }): Promise<IcrcCallCanisterResult> => await this.call(params);
      }

      let relyingParty: TestRelyingParty;

      const result: IcrcCallCanisterResult = {
        contentMap: uint8ArrayToBase64(new Uint8Array([1, 2, 3, 4])),
        certificate: uint8ArrayToBase64(new Uint8Array([5, 6, 7, 8]))
      };

      beforeEach(async () => {
        const promise = TestRelyingParty.connect(mockParameters);

        window.dispatchEvent(messageEventReady);

        relyingParty = await promise;
      });

      afterEach(async () => {
        await relyingParty.disconnect();
      });

      describe('Request errors', () => {
        it('should throw error if the signer request options are not well formatted', async () => {
          await expect(
            // @ts-expect-error: we are testing this on purpose
            relyingParty.call({options: {timeoutInMilliseconds: 'test'}})
          ).rejects.toThrow('Wallet request options cannot be parsed:');
        });

        const options = [
          {
            title: 'default options'
          },
          {
            title: 'custom timeout',
            options: {timeoutInMilliseconds: 120000}
          }
        ];

        it.each(options)(
          'should timeout for $title if signer does not answer with result',
          ({options}) =>
            // eslint-disable-next-line no-async-promise-executor
            new Promise<void>(async (resolve) => {
              vi.useFakeTimers();

              const timeout = options?.timeoutInMilliseconds ?? RELYING_PARTY_TIMEOUT_CALL_CANISTER;

              relyingParty
                .testCall({options, params: mockCallCanisterParams})
                .catch((err: Error) => {
                  expect(err.message).toBe(
                    `Request to signer timed out after ${timeout} milliseconds.`
                  );

                  vi.useRealTimers();

                  resolve();
                });

              await vi.advanceTimersByTimeAsync(timeout);
            })
        );

        it('should timeout if response ID is not the same as request ID', () =>
          // eslint-disable-next-line no-async-promise-executor
          new Promise<void>(async (resolve) => {
            vi.useFakeTimers();

            const spy = vi.spyOn(IcrcCallCanisterResponseSchema, 'safeParse');

            relyingParty.testCall({params: mockCallCanisterParams}).catch((err: Error) => {
              expect(err.message).toBe(
                `Request to signer timed out after ${RELYING_PARTY_TIMEOUT_CALL_CANISTER} milliseconds.`
              );

              expect(spy).toHaveBeenCalledOnce();

              vi.useRealTimers();

              resolve();
            });

            const messageEventScopes = new MessageEvent('message', {
              origin: mockParameters.url,
              source: window,
              data: {
                jsonrpc: JSON_RPC_VERSION_2,
                id: '123',
                result
              }
            });

            window.dispatchEvent(messageEventScopes);

            await vi.advanceTimersByTimeAsync(RELYING_PARTY_TIMEOUT_CALL_CANISTER);
          }));

        it('should throw error if the message received comes from another origin', async () => {
          const hackerOrigin = 'https://hacker.com';

          const promise = relyingParty.testCall({params: mockCallCanisterParams});

          const messageEvent = new MessageEvent('message', {
            origin: hackerOrigin,
            source: window,
            data: {
              jsonrpc: JSON_RPC_VERSION_2,
              id: '123',
              result
            }
          });

          window.dispatchEvent(messageEvent);

          await expect(promise).rejects.toThrow(
            `The response origin ${hackerOrigin} does not match the signer origin ${mockParameters.url}.`
          );
        });

        it('should throw a response error if the signer notify an error', async () => {
          const testId = crypto.randomUUID();

          const promise = relyingParty.testCall({
            options: {requestId: testId},
            params: mockCallCanisterParams
          });

          const errorMsg = 'This is a test error.';

          const messageEvent = new MessageEvent('message', {
            origin: mockParameters.url,
            source: window,
            data: {
              jsonrpc: JSON_RPC_VERSION_2,
              id: testId,
              error: {
                code: SignerErrorCode.GENERIC_ERROR,
                message: errorMsg
              }
            }
          });

          window.dispatchEvent(messageEvent);

          const error = {
            code: SignerErrorCode.GENERIC_ERROR,
            message: errorMsg
          };

          await expect(promise).rejects.toThrow(new RelyingPartyResponseError(error));
        });

        it('should throw error if the signer popup is closed', async () => {
          const spy = vi.spyOn(window, 'close').mockImplementation(() => {
            // @ts-expect-error: we are testing this on purpose
            this.closed = true;
          });

          window.close();

          await expect(relyingParty.testCall({params: mockCallCanisterParams})).rejects.toThrow(
            'The signer has been closed. Your request cannot be processed.'
          );

          spy.mockReset();

          (window as {closed: boolean}).closed = false;
        });
      });

      describe('Request success', () => {
        const requestId = crypto.randomUUID();

        const messagePayload = {
          origin: mockParameters.url,
          source: window,
          data: {
            jsonrpc: JSON_RPC_VERSION_2,
            id: requestId,
            result
          }
        };

        const messageEventScopes = new MessageEvent('message', messagePayload);

        let spyAssertCallResponse: MockInstance;

        beforeEach(() => {
          spyAssertCallResponse = vi
            .spyOn(callUtils, 'assertCallResponse')
            .mockImplementation(() => {
              // Do nothing
            });
        });

        it('should call the signer with postMessage and encoded arguments', async () => {
          const spy = vi.spyOn(relyingPartyHandlers, 'requestCallCanister');
          const spyPostMessage = vi.spyOn(window, 'postMessage');

          const promise = relyingParty.testCall({
            options: {requestId},
            params: mockCallCanisterParams
          });

          window.dispatchEvent(messageEventScopes);

          await promise;

          expect(spy).toHaveBeenCalledOnce();
          expect(spyPostMessage).toHaveBeenCalledOnce();

          expect(spyPostMessage).toHaveBeenCalledWith(
            expect.objectContaining({
              jsonrpc: JSON_RPC_VERSION_2,
              method: ICRC49_CALL_CANISTER,
              params: mockCallCanisterParams
            }),
            mockParameters.url
          );
        });

        it('should respond with the result', async () => {
          const promise = relyingParty.testCall({
            options: {requestId},
            params: mockCallCanisterParams
          });

          window.dispatchEvent(messageEventScopes);

          const callResult = await promise;

          expect(callResult).toEqual(result);
        });

        it('should call the assertions utils to validate the result', async () => {
          const promise = relyingParty.testCall({
            options: {requestId},
            params: mockCallCanisterParams
          });

          window.dispatchEvent(messageEventScopes);

          const callResult = await promise;

          expect(spyAssertCallResponse).toHaveBeenCalledOnce();

          expect(spyAssertCallResponse).toHaveBeenCalledWith({
            result: callResult,
            params: mockCallCanisterParams
          });
        });

        it('should throw an error if the message source is not the opened popup window', async () => {
          const mockHackerWindow = {} as Window;

          const messageEventWithDifferentSource = new MessageEvent('message', {
            ...messagePayload,
            source: mockHackerWindow
          });

          const promise = relyingParty.testCall({
            options: {requestId},
            params: mockCallCanisterParams
          });

          window.dispatchEvent(messageEventWithDifferentSource);

          await expect(async () => await promise).rejects.toThrow(
            'The response is not originating from the window that was opened.'
          );
        });
      });
    });

    describe('Opinionated functions', () => {
      describe('RequestPermissionsNotGranted', () => {
        let relyingParty: RelyingParty;

        beforeEach(async () => {
          const promise = RelyingParty.connect(mockParameters);

          window.dispatchEvent(messageEventReady);

          relyingParty = await promise;

          vi.spyOn(relyingParty, 'permissions').mockResolvedValue([
            {scope: {method: ICRC27_ACCOUNTS}, state: ICRC25_PERMISSION_GRANTED},
            {scope: {method: ICRC49_CALL_CANISTER}, state: ICRC25_PERMISSION_DENIED}
          ]);

          vi.spyOn(relyingParty, 'requestPermissions').mockResolvedValue([
            {scope: {method: ICRC27_ACCOUNTS}, state: ICRC25_PERMISSION_GRANTED},
            {scope: {method: ICRC49_CALL_CANISTER}, state: ICRC25_PERMISSION_GRANTED}
          ]);
        });

        afterEach(async () => {
          await relyingParty.disconnect();

          vi.restoreAllMocks();
        });

        it('should return allPermissionsGranted: true if all permissions are already granted', async () => {
          vi.spyOn(relyingParty, 'permissions').mockResolvedValue([
            {scope: {method: ICRC27_ACCOUNTS}, state: ICRC25_PERMISSION_GRANTED},
            {scope: {method: ICRC49_CALL_CANISTER}, state: ICRC25_PERMISSION_GRANTED}
          ]);

          const result = await relyingParty.requestPermissionsNotGranted();

          expect(result).toEqual({allPermissionsGranted: true});
          expect(relyingParty.requestPermissions).not.toHaveBeenCalled();
        });

        it('should request only missing permissions if some are not granted', async () => {
          const result = await relyingParty.requestPermissionsNotGranted();

          expect(result).toEqual({allPermissionsGranted: true});
          expect(relyingParty.requestPermissions).toHaveBeenCalledWith({
            params: {scopes: [{method: ICRC49_CALL_CANISTER}]}
          });
        });

        it('should return allPermissionsGranted: false if permissions remain ungranted after request', async () => {
          vi.spyOn(relyingParty, 'requestPermissions').mockResolvedValue([
            {scope: {method: ICRC27_ACCOUNTS}, state: ICRC25_PERMISSION_GRANTED},
            {scope: {method: ICRC49_CALL_CANISTER}, state: ICRC25_PERMISSION_DENIED}
          ]);

          const result = await relyingParty.requestPermissionsNotGranted();

          expect(result).toEqual({allPermissionsGranted: false});
        });

        it('should throw an error if no permissions data is returned by the signer', async () => {
          vi.spyOn(relyingParty, 'permissions').mockResolvedValue([]);

          await expect(relyingParty.requestPermissionsNotGranted()).rejects.toThrow(
            'The signer did not provide any data about the current set of permissions.'
          );
        });

        it('should throw an error if no permissions data is returned after requesting permissions', async () => {
          vi.spyOn(relyingParty, 'requestPermissions').mockResolvedValue([]);

          await expect(relyingParty.requestPermissionsNotGranted()).rejects.toThrow(
            'The signer did not provide any data about the current set of permissions following the request.'
          );
        });

        it('should handle errors from permissions check gracefully', async () => {
          vi.spyOn(relyingParty, 'permissions').mockRejectedValue(
            new Error('Permissions check failed')
          );

          await expect(relyingParty.requestPermissionsNotGranted()).rejects.toThrow(
            'Permissions check failed'
          );
        });

        it('should handle errors from requesting permissions gracefully', async () => {
          vi.spyOn(relyingParty, 'requestPermissions').mockRejectedValue(
            new Error('Request permissions failed')
          );

          await expect(relyingParty.requestPermissionsNotGranted()).rejects.toThrow(
            'Request permissions failed'
          );
        });
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
      await expect(RelyingParty.connect(mockParameters)).rejects.toThrow(
        'Unable to open the signer window.'
      );
    });
  });
});
