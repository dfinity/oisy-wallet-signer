import {
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
import * as relyingPartyHandlers from './handlers/relying-party.handlers';
import {mockAccounts, mockPrincipalText} from './mocks/icrc-accounts.mocks';
import {RelyingParty} from './relying-party';
import type {IcrcAnyRequestedScopes, IcrcCallCanisterRequestParams} from './types/icrc-requests';
import {
  IcrcAccountsResponseSchema,
  IcrcCallCanisterResultResponseSchema,
  IcrcScopesResponseSchema,
  IcrcSupportedStandardsResponseSchema,
  type IcrcCallCanisterResult
} from './types/icrc-responses';
import {RelyingPartyResponseError} from './types/relying-party-errors';
import type {RelyingPartyOptions} from './types/relying-party-options';
import {JSON_RPC_VERSION_2, RpcResponseWithResultOrErrorSchema} from './types/rpc';
import {WALLET_WINDOW_CENTER, WALLET_WINDOW_TOP_RIGHT, windowFeatures} from './utils/window.utils';

describe('Relying Party', () => {
  const mockParameters: RelyingPartyOptions = {url: 'https://test.com'};

  const messageEventReady = new MessageEvent('message', {
    origin: mockParameters.url,
    data: {
      jsonrpc: JSON_RPC_VERSION_2,
      id: crypto.randomUUID(),
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
      vi.stubGlobal('focus', vi.fn());
    });

    afterEach(() => {
      window.open = originalOpen;

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

          const promise = RelyingParty.connect(params);

          window.dispatchEvent(messageEventReady);

          const relyingParty = await promise;

          expect(relyingParty).toBeInstanceOf(RelyingParty);

          expect(window.open).toHaveBeenCalledWith(
            mockParameters.url,
            'relyingPartyWindow',
            expectedOptions
          );
          expect(window.open).toHaveBeenCalledTimes(1);

          expect(addEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
          expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
        });

        it('should call the signer to poll for status', async () => {
          const spy = vi.spyOn(relyingPartyHandlers, 'retryRequestStatus');
          const spyPostMessage = vi.spyOn(window, 'postMessage');

          const promise = RelyingParty.connect(mockParameters);

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

          const promise = RelyingParty.connect(mockParameters);

          const messageEventNotRpc = new MessageEvent('message', {
            data: 'test',
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

          expect(window.open).toHaveBeenCalledTimes(1);
          expect(window.close).not.toHaveBeenCalled();
        });

        it('should close popup on connection not successful', async () =>
          // eslint-disable-next-line @typescript-eslint/return-await, no-async-promise-executor, @typescript-eslint/no-misused-promises
          new Promise<void>(async (resolve) => {
            vi.useFakeTimers();

            RelyingParty.connect(mockParameters).catch((err: Error) => {
              expect(err.message).toBe('Connection timeout. Unable to connect to the signer.');

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
          const promise = RelyingParty.connect(mockParameters);

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
          async ({options}) =>
            // eslint-disable-next-line @typescript-eslint/return-await, no-async-promise-executor, @typescript-eslint/no-misused-promises
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

        it('should timeout if response ID is not the same as request ID', async () =>
          // eslint-disable-next-line @typescript-eslint/return-await, no-async-promise-executor, @typescript-eslint/no-misused-promises
          new Promise<void>(async (resolve) => {
            vi.useFakeTimers();

            const spy = vi.spyOn(IcrcSupportedStandardsResponseSchema, 'safeParse');

            relyingParty.supportedStandards().catch((err: Error) => {
              expect(err.message).toBe(
                `Request to signer timed out after ${RELYING_PARTY_TIMEOUT_REQUEST_SUPPORTED_STANDARD} milliseconds.`
              );

              expect(spy).toHaveBeenCalledTimes(1);

              vi.useRealTimers();

              resolve();
            });

            const messageEventSupportedStandards = new MessageEvent('message', {
              origin: mockParameters.url,
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

          await expect(promise).rejects.toThrowError(new RelyingPartyResponseError(error));
        });
      });

      describe('Request success', () => {
        const requestId = crypto.randomUUID();

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

        it('should call the signer with postMessage', async () => {
          const spy = vi.spyOn(relyingPartyHandlers, 'requestSupportedStandards');
          const spyPostMessage = vi.spyOn(window, 'postMessage');

          const promise = relyingParty.supportedStandards({options: {requestId}});

          window.dispatchEvent(messageEventSupportedStandards);

          await promise;

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

        it('should respond with the supported standards', async () => {
          const promise = relyingParty.supportedStandards({options: {requestId}});

          window.dispatchEvent(messageEventSupportedStandards);

          const result = await promise;

          expect(result).toEqual(supportedStandards);
        });
      });
    });

    describe('Permissions', () => {
      let relyingParty: RelyingParty;

      const scopes = [
        {scope: {method: ICRC27_ACCOUNTS}, state: 'granted'},
        {scope: {method: ICRC49_CALL_CANISTER}, state: 'denied'}
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
            async ({options}) =>
              // eslint-disable-next-line @typescript-eslint/return-await, no-async-promise-executor, @typescript-eslint/no-misused-promises
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

          it('should timeout if response ID is not the same as request ID', async () =>
            // eslint-disable-next-line @typescript-eslint/return-await, no-async-promise-executor, @typescript-eslint/no-misused-promises
            new Promise<void>(async (resolve) => {
              vi.useFakeTimers();

              const spy = vi.spyOn(IcrcScopesResponseSchema, 'safeParse');

              relyingParty.permissions().catch((err: Error) => {
                expect(err.message).toBe(
                  `Request to signer timed out after ${RELYING_PARTY_TIMEOUT_PERMISSIONS} milliseconds.`
                );

                expect(spy).toHaveBeenCalledTimes(1);

                vi.useRealTimers();

                resolve();
              });

              const messageEventScopes = new MessageEvent('message', {
                origin: mockParameters.url,
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

            await expect(promise).rejects.toThrowError(new RelyingPartyResponseError(error));
          });
        });

        describe('Request success', () => {
          const requestId = crypto.randomUUID();

          const messageEventScopes = new MessageEvent('message', {
            origin: mockParameters.url,
            data: {
              jsonrpc: JSON_RPC_VERSION_2,
              id: requestId,
              result: {
                scopes
              }
            }
          });

          it('should call the signer with postMessage', async () => {
            const spy = vi.spyOn(relyingPartyHandlers, 'permissions');
            const spyPostMessage = vi.spyOn(window, 'postMessage');

            const promise = relyingParty.permissions({options: {requestId}});

            window.dispatchEvent(messageEventScopes);

            await promise;

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spyPostMessage).toHaveBeenCalledTimes(1);

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
            async ({options}) =>
              // eslint-disable-next-line @typescript-eslint/return-await, no-async-promise-executor, @typescript-eslint/no-misused-promises
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

          it('should timeout if response ID is not the same as request ID', async () =>
            // eslint-disable-next-line @typescript-eslint/return-await, no-async-promise-executor, @typescript-eslint/no-misused-promises
            new Promise<void>(async (resolve) => {
              vi.useFakeTimers();

              const spy = vi.spyOn(IcrcScopesResponseSchema, 'safeParse');

              relyingParty.requestPermissions().catch((err: Error) => {
                expect(err.message).toBe(
                  `Request to signer timed out after ${RELYING_PARTY_TIMEOUT_REQUEST_PERMISSIONS} milliseconds.`
                );

                expect(spy).toHaveBeenCalledTimes(1);

                vi.useRealTimers();

                resolve();
              });

              const messageEventScopes = new MessageEvent('message', {
                origin: mockParameters.url,
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

            await expect(promise).rejects.toThrowError(new RelyingPartyResponseError(error));
          });
        });

        describe('Request success', () => {
          const requestId = crypto.randomUUID();

          const messageEventScopes = new MessageEvent('message', {
            origin: mockParameters.url,
            data: {
              jsonrpc: JSON_RPC_VERSION_2,
              id: requestId,
              result: {
                scopes
              }
            }
          });

          it('should call the signer with postMessage and default scopes', async () => {
            const spy = vi.spyOn(relyingPartyHandlers, 'requestPermissions');
            const spyPostMessage = vi.spyOn(window, 'postMessage');

            const promise = relyingParty.requestPermissions({options: {requestId}});

            window.dispatchEvent(messageEventScopes);

            await promise;

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spyPostMessage).toHaveBeenCalledTimes(1);

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

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spyPostMessage).toHaveBeenCalledTimes(1);

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
          async ({options}) =>
            // eslint-disable-next-line @typescript-eslint/return-await, no-async-promise-executor, @typescript-eslint/no-misused-promises
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

        it('should timeout if response ID is not the same as request ID', async () =>
          // eslint-disable-next-line @typescript-eslint/return-await, no-async-promise-executor, @typescript-eslint/no-misused-promises
          new Promise<void>(async (resolve) => {
            vi.useFakeTimers();

            const spy = vi.spyOn(IcrcAccountsResponseSchema, 'safeParse');

            relyingParty.accounts().catch((err: Error) => {
              expect(err.message).toBe(
                `Request to signer timed out after ${RELYING_PARTY_TIMEOUT_ACCOUNTS} milliseconds.`
              );

              expect(spy).toHaveBeenCalledTimes(1);

              vi.useRealTimers();

              resolve();
            });

            const messageEventSupportedStandards = new MessageEvent('message', {
              origin: mockParameters.url,
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

          await expect(promise).rejects.toThrowError(new RelyingPartyResponseError(error));
        });
      });

      describe('Request success', () => {
        const requestId = crypto.randomUUID();

        const messageEventSupportedStandards = new MessageEvent('message', {
          origin: mockParameters.url,
          data: {
            jsonrpc: JSON_RPC_VERSION_2,
            id: requestId,
            result: {
              accounts: mockAccounts
            }
          }
        });

        it('should call the signer with postMessage', async () => {
          const spy = vi.spyOn(relyingPartyHandlers, 'requestAccounts');
          const spyPostMessage = vi.spyOn(window, 'postMessage');

          const promise = relyingParty.accounts({options: {requestId}});

          window.dispatchEvent(messageEventSupportedStandards);

          await promise;

          expect(spy).toHaveBeenCalledTimes(1);
          expect(spyPostMessage).toHaveBeenCalledTimes(1);

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
      });
    });

    describe('Call', () => {
      let relyingParty: RelyingParty;

      const params: IcrcCallCanisterRequestParams = {
        canisterId: mockPrincipalText,
        sender: mockPrincipalText,
        method: 'some_method',
        arg: new Uint8Array([1, 2, 3, 4, 5, 6, 7])
      };

      const result: IcrcCallCanisterResult = {
        contentMap: new Uint8Array([1, 2, 3, 4]),
        certificate: new Uint8Array([5, 6, 7, 8])
      };

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
          async ({options}) =>
            // eslint-disable-next-line @typescript-eslint/return-await, no-async-promise-executor, @typescript-eslint/no-misused-promises
            new Promise<void>(async (resolve) => {
              vi.useFakeTimers();

              const timeout = options?.timeoutInMilliseconds ?? RELYING_PARTY_TIMEOUT_CALL_CANISTER;

              relyingParty.call({options, params}).catch((err: Error) => {
                expect(err.message).toBe(
                  `Request to signer timed out after ${timeout} milliseconds.`
                );

                vi.useRealTimers();

                resolve();
              });

              await vi.advanceTimersByTimeAsync(timeout);
            })
        );

        it('should timeout if response ID is not the same as request ID', async () =>
          // eslint-disable-next-line @typescript-eslint/return-await, no-async-promise-executor, @typescript-eslint/no-misused-promises
          new Promise<void>(async (resolve) => {
            vi.useFakeTimers();

            const spy = vi.spyOn(IcrcCallCanisterResultResponseSchema, 'safeParse');

            relyingParty.call({params}).catch((err: Error) => {
              expect(err.message).toBe(
                `Request to signer timed out after ${RELYING_PARTY_TIMEOUT_CALL_CANISTER} milliseconds.`
              );

              expect(spy).toHaveBeenCalledTimes(1);

              vi.useRealTimers();

              resolve();
            });

            const messageEventScopes = new MessageEvent('message', {
              origin: mockParameters.url,
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

          const promise = relyingParty.call({params});

          const messageEvent = new MessageEvent('message', {
            origin: hackerOrigin,
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

          const promise = relyingParty.call({options: {requestId: testId}, params});

          const errorMsg = 'This is a test error.';

          const messageEvent = new MessageEvent('message', {
            origin: mockParameters.url,
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

          await expect(promise).rejects.toThrowError(new RelyingPartyResponseError(error));
        });
      });

      describe('Request success', () => {
        const requestId = crypto.randomUUID();

        const messageEventScopes = new MessageEvent('message', {
          origin: mockParameters.url,
          data: {
            jsonrpc: JSON_RPC_VERSION_2,
            id: requestId,
            result
          }
        });

        it('should call the signer with postMessage and encoded arguments', async () => {
          const spy = vi.spyOn(relyingPartyHandlers, 'requestCallCanister');
          const spyPostMessage = vi.spyOn(window, 'postMessage');

          const promise = relyingParty.call({options: {requestId}, params});

          window.dispatchEvent(messageEventScopes);

          await promise;

          expect(spy).toHaveBeenCalledTimes(1);
          expect(spyPostMessage).toHaveBeenCalledTimes(1);

          expect(spyPostMessage).toHaveBeenCalledWith(
            expect.objectContaining({
              jsonrpc: JSON_RPC_VERSION_2,
              method: ICRC49_CALL_CANISTER,
              params
            }),
            mockParameters.url
          );
        });

        it('should respond with the result', async () => {
          const promise = relyingParty.call({options: {requestId}, params});

          window.dispatchEvent(messageEventScopes);

          const callResult = await promise;

          expect(callResult).toEqual(result);
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
