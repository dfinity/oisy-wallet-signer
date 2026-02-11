import {Ed25519KeyIdentity} from '@icp-sdk/core/identity';
import type {MockInstance} from 'vitest';
import {Icrc21Canister} from './api/icrc21-canister.api';
import {SignerApi} from './api/signer.api';
import {
  ICRC21_CALL_CONSENT_MESSAGE,
  ICRC25_PERMISSION_ASK_ON_USE,
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
  SIGNER_DEFAULT_SCOPES,
  SIGNER_PERMISSION_VALIDITY_PERIOD_IN_MILLISECONDS,
  SIGNER_SUPPORTED_STANDARDS,
  SignerErrorCode
} from './constants/signer.constants';
import * as signerSuccessHandlers from './handlers/signer-success.handlers';
import * as signerHandlers from './handlers/signer.handlers';
import {mockCallCanisterParams, mockCallCanisterSuccess} from './mocks/call-canister.mocks';
import {mockConsentInfo} from './mocks/consent-message.mocks';
import {mockAccounts} from './mocks/icrc-accounts.mocks';
import {mockErrorNotify} from './mocks/signer-error.mocks';
import {saveSessionScopes} from './sessions/signer.sessions';
import {Signer} from './signer';
import type {
  IcrcAccountsRequest,
  IcrcCallCanisterRequest,
  IcrcPermissionsRequest,
  IcrcRequestAnyPermissionsRequest,
  IcrcStatusRequest
} from './types/icrc-requests';
import type {IcrcScopesArray} from './types/icrc-responses';
import {IcrcPermissionStateSchema, type IcrcScopedMethod} from './types/icrc-standards';
import type {Origin} from './types/post-message';
import {JSON_RPC_VERSION_2} from './types/rpc';
import type {SignerMessageEventData} from './types/signer';
import type {SignerOptions} from './types/signer-options';
import {
  AccountsPromptSchema,
  CallCanisterPromptSchema,
  ConsentMessagePromptSchema,
  PermissionsPromptSchema,
  type AccountsApproval,
  type AccountsPromptPayload,
  type ConsentMessageApproval,
  type ConsentMessagePromptPayload,
  type PermissionsConfirmation,
  type PermissionsPromptPayload,
  type Rejection
} from './types/signer-prompts';
import type {SessionPermissions} from './types/signer-sessions';
import {mapIcrc21ErrorToString} from './utils/icrc-21.utils';
import {del, get} from './utils/storage.utils';

describe('Signer', () => {
  const owner = Ed25519KeyIdentity.generate();

  const signerOptions: SignerOptions = {
    owner,
    host: 'http://localhost:4943'
  };

  it('should init a signer', () => {
    const signer = Signer.init(signerOptions);

    expect(signer).toBeInstanceOf(Signer);

    signer.disconnect();
  });

  it('should add event listener for message on connect', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    const signer = Signer.init(signerOptions);

    expect(addEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));

    signer.disconnect();
  });

  it('should remove event listener for message on disconnect', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const signer = Signer.init(signerOptions);
    signer.disconnect();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
  });

  it('should clean actors on disconnect', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const signer = Signer.init(signerOptions);
    signer.disconnect();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
  });

  describe('onMessage', () => {
    const messageEvent = new MessageEvent('message', {
      data: 'test',
      origin: 'https://test.com'
    });

    let onMessageListenerSpy: MockInstance;

    let signer: Signer;

    beforeEach(() => {
      signer = Signer.init(signerOptions);
      onMessageListenerSpy = vi.spyOn(signer as unknown as {onMessage: () => void}, 'onMessage');
    });

    afterEach(() => {
      signer.disconnect();
      onMessageListenerSpy.mockClear();

      vi.clearAllMocks();
    });

    it('should process message when a message event is received', () => {
      window.dispatchEvent(messageEvent);

      expect(onMessageListenerSpy).toHaveBeenCalledWith(messageEvent);
    });

    it('should not process message which are not RpcRequest', () => {
      const spyAssertAndSetOrigin = vi.spyOn(
        signer as unknown as {
          assertNotUndefinedAndSameOrigin: (params: {
            origin: Origin;
            msgData: SignerMessageEventData;
          }) => void;
        },
        'assertNotUndefinedAndSameOrigin'
      );

      window.dispatchEvent(messageEvent);

      expect(spyAssertAndSetOrigin).not.toHaveBeenCalled();
    });

    it('should not process message when a message event is received', () => {
      signer.disconnect();

      window.dispatchEvent(messageEvent);

      expect(onMessageListenerSpy).not.toHaveBeenCalled();
    });
  });

  describe('Origin', () => {
    const testId = crypto.randomUUID();

    let originalOpener: typeof window.opener;

    let notifyReadySpy: MockInstance;
    let signer: Signer;

    let postMessageMock: MockInstance;

    beforeEach(() => {
      signer = Signer.init(signerOptions);
      notifyReadySpy = vi.spyOn(signerSuccessHandlers, 'notifyReady');
      postMessageMock = vi.fn();
      vi.stubGlobal('opener', {postMessage: postMessageMock});
    });

    afterEach(() => {
      signer.disconnect();

      window.opener = originalOpener;

      vi.clearAllMocks();
      vi.restoreAllMocks();
    });

    it('should use the origin and respond with a post message', () => {
      const testOrigin = 'https://hello.com';

      const messageEvent = new MessageEvent('message', {
        data: {
          id: testId,
          jsonrpc: JSON_RPC_VERSION_2,
          method: ICRC29_STATUS
        },
        origin: testOrigin
      });

      window.dispatchEvent(messageEvent);

      expect(notifyReadySpy).toHaveBeenCalledWith({
        id: testId,
        origin: testOrigin
      });
    });

    it('should notify an error if a message from different origin is dispatched when trying to establish connection', () => {
      const testOrigin = 'https://hello.com';
      const differentOrigin = 'https://test.com';

      const msg = {
        data: {
          id: testId,
          jsonrpc: JSON_RPC_VERSION_2,
          method: ICRC29_STATUS
        },
        origin: testOrigin
      };

      const messageEvent = new MessageEvent('message', msg);
      window.dispatchEvent(messageEvent);

      const messageEventDiff = new MessageEvent('message', {...msg, origin: differentOrigin});
      window.dispatchEvent(messageEventDiff);

      expect(postMessageMock).toHaveBeenCalledWith(
        {
          jsonrpc: JSON_RPC_VERSION_2,
          id: testId,
          error: {
            code: 500,
            message:
              "The relying party's origin is not permitted to obtain the status of the signer."
          }
        },
        differentOrigin
      );
    });

    it('should notify an error if a message from different origin is dispatched', () => {
      const testOrigin = 'https://hello.com';
      const differentOrigin = 'https://test.com';

      const msg = {
        data: {
          id: testId,
          jsonrpc: JSON_RPC_VERSION_2,
          method: ICRC29_STATUS
        },
        origin: testOrigin
      };

      const messageEvent = new MessageEvent('message', msg);
      window.dispatchEvent(messageEvent);

      const requestPermissionsData: IcrcRequestAnyPermissionsRequest = {
        id: testId,
        jsonrpc: JSON_RPC_VERSION_2,
        method: ICRC25_REQUEST_PERMISSIONS,
        params: {
          scopes: [{method: ICRC49_CALL_CANISTER}, {method: ICRC27_ACCOUNTS}]
        }
      };

      const messageEventDiff = new MessageEvent('message', {
        data: requestPermissionsData,
        origin: differentOrigin
      });
      window.dispatchEvent(messageEventDiff);

      expect(postMessageMock).toHaveBeenCalledWith(
        {
          jsonrpc: JSON_RPC_VERSION_2,
          id: testId,
          error: {
            code: 500,
            message: "The relying party's origin is not allowed to interact with the signer."
          }
        },
        differentOrigin
      );
    });

    it('should reset #walletOrigin to null after disconnect', () => {
      const testOrigin = 'https://hello.com';
      const differentOrigin = 'https://world.com';

      const msg = {
        data: {
          id: testId,
          jsonrpc: JSON_RPC_VERSION_2,
          method: ICRC29_STATUS
        },
        origin: testOrigin
      };

      const messageEvent = new MessageEvent('message', msg);
      window.dispatchEvent(messageEvent);

      const messageEventDiff = new MessageEvent('message', {...msg, origin: differentOrigin});

      signer.disconnect();

      expect(() => {
        window.dispatchEvent(messageEventDiff);
      }).not.toThrowError();
    });
  });

  describe('Exchange postMessage', () => {
    const testId = crypto.randomUUID();
    const testOrigin = 'https://hello.com';

    const requestStatus: MessageEventInit<IcrcStatusRequest> = {
      data: {
        id: testId,
        jsonrpc: JSON_RPC_VERSION_2,
        method: ICRC29_STATUS
      },
      origin: testOrigin
    };

    const requestPermissions: MessageEventInit<IcrcPermissionsRequest> = {
      data: {
        id: testId,
        jsonrpc: JSON_RPC_VERSION_2,
        method: ICRC25_PERMISSIONS
      },
      origin: testOrigin
    };

    const requestPermissionsData: IcrcRequestAnyPermissionsRequest = {
      id: testId,
      jsonrpc: JSON_RPC_VERSION_2,
      method: ICRC25_REQUEST_PERMISSIONS,
      params: {
        scopes: [{method: ICRC49_CALL_CANISTER}, {method: ICRC27_ACCOUNTS}]
      }
    };

    const requestSupportedStandards = {
      data: {
        id: testId,
        jsonrpc: JSON_RPC_VERSION_2,
        method: ICRC25_SUPPORTED_STANDARDS
      },
      origin: testOrigin
    };

    const requestPermissionsDataSortedScopes = requestPermissionsData.params.scopes.sort(
      ({method: methodA}, {method: methodB}): number => methodA.localeCompare(methodB)
    );

    const requestPermissionsMsg = {
      data: requestPermissionsData,
      origin: testOrigin
    };

    let originalOpener: typeof window.opener;

    let postMessageMock: MockInstance;

    beforeEach(() => {
      postMessageMock = vi.fn();

      vi.stubGlobal('opener', {postMessage: postMessageMock});
    });

    afterEach(() => {
      window.opener = originalOpener;

      vi.clearAllMocks();
      vi.restoreAllMocks();
    });

    const initWalletReady = async (): Promise<void> => {
      const messageEvent = new MessageEvent('message', requestStatus);
      window.dispatchEvent(messageEvent);

      await vi.waitFor(() => {
        expect(postMessageMock).toHaveBeenCalledWith(
          {
            jsonrpc: JSON_RPC_VERSION_2,
            id: testId,
            result: 'ready'
          },
          testOrigin
        );
      });
    };

    describe('Standard options', () => {
      let signer: Signer;

      beforeEach(() => {
        signer = Signer.init(signerOptions);
      });

      afterEach(() => {
        signer.disconnect();
      });

      const assertReadOnlyIfBusy = () => {
        it('should notify ready even if signer is busy', () => {
          const messageEvent = new MessageEvent('message', requestStatus);
          window.dispatchEvent(messageEvent);

          expect(postMessageMock).toHaveBeenLastCalledWith(
            {
              jsonrpc: JSON_RPC_VERSION_2,
              id: testId,
              result: 'ready'
            },
            testOrigin
          );
        });

        it('should not notify error BUSY if signer is busy', () => {
          const messageEvent = new MessageEvent('message', requestStatus);
          window.dispatchEvent(messageEvent);

          expect(postMessageMock).not.toHaveBeenLastCalledWith(
            {
              jsonrpc: JSON_RPC_VERSION_2,
              id: testId,
              error: {
                code: SignerErrorCode.BUSY,
                message:
                  'The signer is currently processing a request and cannot handle new requests at this time.'
              }
            },
            testOrigin
          );
        });

        it('should notify supported standards even if signer is busy', () => {
          const messageEvent = new MessageEvent('message', requestSupportedStandards);
          window.dispatchEvent(messageEvent);

          expect(postMessageMock).toHaveBeenCalledWith(
            {
              jsonrpc: JSON_RPC_VERSION_2,
              id: testId,
              result: {
                supportedStandards: SIGNER_SUPPORTED_STANDARDS
              }
            },
            testOrigin
          );
        });
      };

      describe('Status', () => {
        let notifyAccountsSpy: MockInstance;
        let notifyCallCanisterSpy: MockInstance;
        let notifySupportedStandardsSpy: MockInstance;
        let notifyPermissionsSpy: MockInstance;
        let notifyErrorSpy: MockInstance;

        beforeEach(() => {
          notifyAccountsSpy = vi.spyOn(signerSuccessHandlers, 'notifyAccounts');
          notifyCallCanisterSpy = vi.spyOn(signerSuccessHandlers, 'notifyCallCanister');
          notifySupportedStandardsSpy = vi.spyOn(signerSuccessHandlers, 'notifySupportedStandards');
          notifyPermissionsSpy = vi.spyOn(signerSuccessHandlers, 'notifyPermissionScopes');
          notifyErrorSpy = vi.spyOn(signerHandlers, 'notifyError');
        });

        const assertNotifyReady = () => {
          expect(postMessageMock).toHaveBeenCalledWith(
            {
              jsonrpc: JSON_RPC_VERSION_2,
              id: testId,
              result: 'ready'
            },
            testOrigin
          );
        };

        // eslint-disable-next-line vitest/expect-expect -- assertNotifyReady is called in the test
        it('should notify READY for icrc29_status', () => {
          const messageEvent = new MessageEvent('message', requestStatus);
          window.dispatchEvent(messageEvent);

          assertNotifyReady();
        });

        it('should notify READY everytime subsequent call of icrc29_status', () => {
          const messageEvent = new MessageEvent('message', requestStatus);

          for (let i = 0; i < 3; i++) {
            window.dispatchEvent(messageEvent);

            expect(postMessageMock).toHaveBeenNthCalledWith(
              i + 1,
              {
                jsonrpc: JSON_RPC_VERSION_2,
                id: testId,
                result: 'ready'
              },
              testOrigin
            );
          }
        });

        it('should not notify any other messages than ready', () => {
          const messageEvent = new MessageEvent('message', requestStatus);
          window.dispatchEvent(messageEvent);

          expect(notifyAccountsSpy).not.toHaveBeenCalled();
          expect(notifyCallCanisterSpy).not.toHaveBeenCalled();
          expect(notifySupportedStandardsSpy).not.toHaveBeenCalled();
          expect(notifyPermissionsSpy).not.toHaveBeenCalled();
          expect(notifyErrorSpy).not.toHaveBeenCalled();
        });

        it('should not handle with busy', async () => {
          const handleWithBusySpy = vi.spyOn(
            signer as unknown as {handleWithBusy: () => void},
            'handleWithBusy'
          );
          const messageEvent = new MessageEvent('message', requestStatus);
          window.dispatchEvent(messageEvent);
          await vi.waitFor(() => {
            expect(handleWithBusySpy).not.toHaveBeenCalled();
          });
        });

        it('should not handle with busy even if the answer to the status message has been notified', async () => {
          const handleWithBusySpy = vi.spyOn(
            signer as unknown as {handleWithBusy: () => void},
            'handleWithBusy'
          );
          const messageEvent = new MessageEvent('message', requestStatus);
          window.dispatchEvent(messageEvent);

          // Ensures the answer to the status message has been notified.
          await vi.waitFor(assertNotifyReady);

          expect(handleWithBusySpy).not.toHaveBeenCalled();
        });
      });

      describe('Supported standards', () => {
        const notifySupportedStandards = () => {
          it('should notify supported standards for icrc25_supported_standards', () => {
            const messageEvent = new MessageEvent('message', requestSupportedStandards);
            window.dispatchEvent(messageEvent);

            expect(postMessageMock).toHaveBeenCalledWith(
              {
                jsonrpc: JSON_RPC_VERSION_2,
                id: testId,
                result: {
                  supportedStandards: SIGNER_SUPPORTED_STANDARDS
                }
              },
              testOrigin
            );
          });
        };

        describe('Not ready', () => {
          notifySupportedStandards();
        });

        describe('Ready', () => {
          let notifyAccountsSpy: MockInstance;
          let notifyCallCanisterSpy: MockInstance;
          let notifySupportedStandardsSpy: MockInstance;
          let notifyPermissionsSpy: MockInstance;
          let notifyErrorSpy: MockInstance;

          beforeEach(async () => {
            notifyAccountsSpy = vi.spyOn(signerSuccessHandlers, 'notifyAccounts');
            notifyCallCanisterSpy = vi.spyOn(signerSuccessHandlers, 'notifyCallCanister');
            notifySupportedStandardsSpy = vi.spyOn(
              signerSuccessHandlers,
              'notifySupportedStandards'
            );
            notifyPermissionsSpy = vi.spyOn(signerSuccessHandlers, 'notifyPermissionScopes');
            notifyErrorSpy = vi.spyOn(signerHandlers, 'notifyError');

            await initWalletReady();
          });

          notifySupportedStandards();

          it('should not notify any other messages than ready icrc25_supported_standards', () => {
            const messageEvent = new MessageEvent('message', requestSupportedStandards);
            window.dispatchEvent(messageEvent);

            expect(notifySupportedStandardsSpy).toHaveBeenCalled();
            expect(notifyAccountsSpy).not.toHaveBeenCalled();
            expect(notifyCallCanisterSpy).not.toHaveBeenCalled();
            expect(notifyPermissionsSpy).not.toHaveBeenCalled();
            expect(notifyErrorSpy).not.toHaveBeenCalled();
          });
        });

        // TODO: supported standards should probably also emitted if the signer is busy
      });

      describe('Permissions', () => {
        describe('Not ready', () => {
          it('should notify connection is not yet established', () => {
            const messageEvent = new MessageEvent('message', requestPermissions);
            window.dispatchEvent(messageEvent);

            expect(postMessageMock).toHaveBeenCalledWith(
              {
                jsonrpc: JSON_RPC_VERSION_2,
                id: testId,
                error: {
                  code: SignerErrorCode.ORIGIN_ERROR,
                  message: 'The relying party has not established a connection to the signer.'
                }
              },
              testOrigin
            );
          });
        });

        describe('Ready', () => {
          let notifyAccountsSpy: MockInstance;
          let notifyCallCanisterSpy: MockInstance;
          let notifySupportedStandardsSpy: MockInstance;
          let notifyPermissionsSpy: MockInstance;
          let notifyErrorSpy: MockInstance;

          beforeEach(async () => {
            notifyAccountsSpy = vi.spyOn(signerSuccessHandlers, 'notifyAccounts');
            notifyCallCanisterSpy = vi.spyOn(signerSuccessHandlers, 'notifyCallCanister');
            notifySupportedStandardsSpy = vi.spyOn(
              signerSuccessHandlers,
              'notifySupportedStandards'
            );
            notifyPermissionsSpy = vi.spyOn(signerSuccessHandlers, 'notifyPermissionScopes');
            notifyErrorSpy = vi.spyOn(signerHandlers, 'notifyError');

            vi.useFakeTimers();

            await initWalletReady();
          });

          afterEach(() => {
            vi.useRealTimers();
          });

          it('should notify default permissions for icrc25_permissions', () => {
            const messageEvent = new MessageEvent('message', requestPermissions);
            window.dispatchEvent(messageEvent);

            expect(postMessageMock).toHaveBeenCalledWith(
              {
                jsonrpc: JSON_RPC_VERSION_2,
                id: testId,
                result: {
                  scopes: SIGNER_DEFAULT_SCOPES
                }
              },
              testOrigin
            );
          });

          it('should notify permissions already confirmed and saved in local storage for icrc25_permissions plus default permissions with ask_on_use', () => {
            const owner = signerOptions.owner.getPrincipal();

            const scopes: IcrcScopesArray = [
              {
                scope: {
                  method: ICRC27_ACCOUNTS
                },
                state: ICRC25_PERMISSION_GRANTED
              }
            ];

            saveSessionScopes({
              owner,
              origin: testOrigin,
              scopes
            });

            const messageEvent = new MessageEvent('message', requestPermissions);
            window.dispatchEvent(messageEvent);

            expect(postMessageMock).toHaveBeenCalledWith(
              {
                jsonrpc: JSON_RPC_VERSION_2,
                id: testId,
                result: {
                  scopes: [
                    ...scopes,
                    ...SIGNER_DEFAULT_SCOPES.filter(
                      ({scope: {method}}) => method !== ICRC27_ACCOUNTS
                    )
                  ]
                }
              },
              testOrigin
            );

            del({key: `oisy_signer_${testOrigin}_${owner.toText()}`});
          });

          it('should notify permissions as ask_on_use if expired plus default permissions with ask_on_use as well', () => {
            const owner = signerOptions.owner.getPrincipal();

            const scopes: IcrcScopesArray = [
              {
                scope: {
                  method: ICRC27_ACCOUNTS
                },
                state: ICRC25_PERMISSION_GRANTED
              }
            ];

            saveSessionScopes({
              owner,
              origin: testOrigin,
              scopes
            });

            vi.advanceTimersByTime(SIGNER_PERMISSION_VALIDITY_PERIOD_IN_MILLISECONDS + 1);

            const messageEvent = new MessageEvent('message', requestPermissions);
            window.dispatchEvent(messageEvent);

            expect(postMessageMock).toHaveBeenCalledWith(
              {
                jsonrpc: JSON_RPC_VERSION_2,
                id: testId,
                result: {
                  scopes: [
                    ...scopes.map(({state: _, ...rest}) => ({
                      ...rest,
                      state: ICRC25_PERMISSION_ASK_ON_USE
                    })),
                    ...SIGNER_DEFAULT_SCOPES.filter(
                      ({scope: {method}}) => method !== ICRC27_ACCOUNTS
                    )
                  ]
                }
              },
              testOrigin
            );

            del({key: `oisy_signer_${testOrigin}_${owner.toText()}`});
          });

          it('should not notify any other messages than icrc25_permissions', () => {
            const messageEvent = new MessageEvent('message', requestPermissions);
            window.dispatchEvent(messageEvent);

            expect(notifyPermissionsSpy).toHaveBeenCalled();
            expect(notifySupportedStandardsSpy).not.toHaveBeenCalled();
            expect(notifyAccountsSpy).not.toHaveBeenCalled();
            expect(notifyCallCanisterSpy).not.toHaveBeenCalled();
            expect(notifyErrorSpy).not.toHaveBeenCalled();
          });

          // TODO: should permissions be emitted if the signer is busy?
          // If yes, we should improve the implementation
          // If no, we should create a test that assert that ready is answer even if permissions are queried. However, it's probably difficult to test, probably requires more mocking, therefore not sure it is worth the effort.
        });
      });

      describe('Request permissions', () => {
        describe('Not ready', () => {
          it('should notify connection is not yet established', () => {
            const messageEvent = new MessageEvent('message', {
              data: requestPermissionsData,
              origin: testOrigin
            });
            window.dispatchEvent(messageEvent);

            expect(postMessageMock).toHaveBeenCalledWith(
              {
                jsonrpc: JSON_RPC_VERSION_2,
                id: testId,
                error: {
                  code: SignerErrorCode.ORIGIN_ERROR,
                  message: 'The relying party has not established a connection to the signer.'
                }
              },
              testOrigin
            );
          });
        });

        describe('Ready', () => {
          const prepareConfirm = async (): Promise<{
            confirm: PermissionsConfirmation | undefined;
            messageEvent: MessageEvent;
          }> => {
            let confirm: PermissionsConfirmation | undefined;

            signer.register({
              method: ICRC25_REQUEST_PERMISSIONS,
              prompt: ({confirm: confirmScopes, requestedScopes: _}: PermissionsPromptPayload) => {
                confirm = confirmScopes;
              }
            });

            const messageEvent = new MessageEvent('message', requestPermissionsMsg);
            window.dispatchEvent(messageEvent);

            await vi.waitFor(() => {
              expect(confirm).not.toBeUndefined();
            });

            return {
              confirm,
              messageEvent
            };
          };

          beforeEach(async () => {
            vi.useFakeTimers();

            await initWalletReady();
          });

          afterEach(() => {
            vi.useRealTimers();
          });

          it('should notify REQUEST_NOT_SUPPORTED for invalid request permissions', async () => {
            const testOrigin = 'https://hello.com';

            const {params: _, ...rest} = requestPermissionsData;

            const msg = {
              data: {
                ...rest
              },
              origin: testOrigin
            };

            const messageEvent = new MessageEvent('message', msg);
            window.dispatchEvent(messageEvent);

            await vi.waitFor(() => {
              expect(postMessageMock).toHaveBeenCalledWith(
                {
                  jsonrpc: JSON_RPC_VERSION_2,
                  id: testId,
                  error: {
                    code: SignerErrorCode.REQUEST_NOT_SUPPORTED,
                    message: 'The request sent by the relying party is not supported by the signer.'
                  }
                },
                testOrigin
              );
            });
          });

          it('should notify missing prompt for icrc25_request_permissions', () => {
            const messageEvent = new MessageEvent('message', requestPermissionsMsg);
            window.dispatchEvent(messageEvent);

            expect(postMessageMock).toHaveBeenLastCalledWith(
              {
                jsonrpc: JSON_RPC_VERSION_2,
                id: testId,
                error: {
                  code: SignerErrorCode.PERMISSIONS_PROMPT_NOT_REGISTERED,
                  message:
                    'The signer has not registered a prompt to respond to permission requests.'
                }
              },
              testOrigin
            );
          });

          it('should not post message for icrc25_request_permissions', () => {
            const promptSpy = vi.fn();

            signer.register({
              method: ICRC25_REQUEST_PERMISSIONS,
              prompt: promptSpy
            });

            const messageEvent = new MessageEvent('message', requestPermissionsMsg);
            window.dispatchEvent(messageEvent);

            expect(postMessageMock).toHaveBeenCalledExactlyOnceWith(
              {
                jsonrpc: JSON_RPC_VERSION_2,
                id: testId,
                result: 'ready'
              },
              testOrigin
            );

            promptSpy.mockClear();
          });

          it('should trigger the registered prompt for the request permissions', () => {
            const promptSpy = vi.fn();

            signer.register({
              method: ICRC25_REQUEST_PERMISSIONS,
              prompt: promptSpy
            });

            const messageEvent = new MessageEvent('message', requestPermissionsMsg);
            window.dispatchEvent(messageEvent);

            expect(promptSpy).toHaveBeenCalledExactlyOnceWith({
              requestedScopes: requestPermissionsDataSortedScopes.map((scope) => ({
                scope: {...scope},
                state: IcrcPermissionStateSchema.enum.denied
              })),
              confirm: expect.any(Function),
              origin: testOrigin
            });

            promptSpy.mockClear();
          });

          it('should sort the scopes when triggering the prompt for the request permissions', () => {
            const promptSpy = vi.fn();

            signer.register({
              method: ICRC25_REQUEST_PERMISSIONS,
              prompt: promptSpy
            });

            const messageEvent = new MessageEvent('message', requestPermissionsMsg);
            window.dispatchEvent(messageEvent);

            expect(promptSpy).toHaveBeenCalledExactlyOnceWith({
              requestedScopes: requestPermissionsDataSortedScopes.map((scope) => ({
                scope: {...scope},
                state: IcrcPermissionStateSchema.enum.denied
              })),
              confirm: expect.any(Function),
              origin: testOrigin
            });

            promptSpy.mockClear();
          });

          it('should filter the supported scopes on request permissions', () => {
            const promptSpy = vi.fn();

            signer.register({
              method: ICRC25_REQUEST_PERMISSIONS,
              prompt: promptSpy
            });

            const requestPermissionsMsg = {
              data: {
                ...requestPermissionsData,
                params: {
                  scopes: [
                    ...requestPermissionsDataSortedScopes,
                    {method: 'icrc25_request_permissions'},
                    {method: 'icrc25_permissions'}
                  ]
                }
              },
              origin: testOrigin
            };

            const messageEvent = new MessageEvent('message', requestPermissionsMsg);
            window.dispatchEvent(messageEvent);

            expect(promptSpy).toHaveBeenCalledExactlyOnceWith({
              requestedScopes: requestPermissionsDataSortedScopes.map((scope) => ({
                scope: {...scope},
                state: IcrcPermissionStateSchema.enum.denied
              })),
              confirm: expect.any(Function),
              origin: testOrigin
            });

            promptSpy.mockClear();
          });

          it('should notify all permissions', async () => {
            const {confirm} = await prepareConfirm();

            confirm?.([
              {
                scope: {method: ICRC49_CALL_CANISTER},
                state: IcrcPermissionStateSchema.enum.granted
              }
            ]);

            await vi.waitFor(() => {
              expect(postMessageMock).toHaveBeenCalledWith(
                {
                  jsonrpc: JSON_RPC_VERSION_2,
                  id: testId,
                  result: {
                    scopes: [
                      {
                        scope: {method: ICRC49_CALL_CANISTER},
                        state: IcrcPermissionStateSchema.enum.granted
                      },
                      ...SIGNER_DEFAULT_SCOPES.filter(
                        ({scope: {method}}) => method !== ICRC49_CALL_CANISTER
                      )
                    ]
                  }
                },
                testOrigin
              );
            });
          });

          it('should notify all permissions with those in sessions', async () => {
            let confirm: PermissionsConfirmation | undefined;

            signer.register({
              method: ICRC25_REQUEST_PERMISSIONS,
              prompt: ({confirm: confirmScopes, requestedScopes: _}: PermissionsPromptPayload) => {
                confirm = confirmScopes;
              }
            });

            const scopes: IcrcScopesArray = [
              {
                scope: {
                  method: ICRC27_ACCOUNTS
                },
                state: ICRC25_PERMISSION_GRANTED
              }
            ];

            saveSessionScopes({
              owner: signerOptions.owner.getPrincipal(),
              origin: testOrigin,
              scopes
            });

            const messageEvent = new MessageEvent('message', requestPermissionsMsg);
            window.dispatchEvent(messageEvent);

            await vi.waitFor(() => {
              expect(confirm).not.toBeUndefined();
            });

            confirm?.([
              {
                scope: {method: ICRC49_CALL_CANISTER},
                state: IcrcPermissionStateSchema.enum.granted
              }
            ]);

            await vi.waitFor(() => {
              expect(postMessageMock).toHaveBeenCalledWith(
                {
                  jsonrpc: JSON_RPC_VERSION_2,
                  id: testId,
                  result: {
                    scopes: [
                      ...scopes,
                      {
                        scope: {method: ICRC49_CALL_CANISTER},
                        state: IcrcPermissionStateSchema.enum.granted
                      },
                      // Make the test future prone in case we add more scopes to the library
                      ...SIGNER_DEFAULT_SCOPES.filter(
                        ({scope: {method}}) =>
                          method !== ICRC27_ACCOUNTS && method !== ICRC49_CALL_CANISTER
                      )
                    ]
                  }
                },
                testOrigin
              );
            });

            del({key: `oisy_signer_${testOrigin}_${owner.getPrincipal().toText()}`});
          });

          it('should notify all permissions with those still active and the rest with ask_on_use', async () => {
            let confirm: PermissionsConfirmation | undefined;

            signer.register({
              method: ICRC25_REQUEST_PERMISSIONS,
              prompt: ({confirm: confirmScopes, requestedScopes: _}: PermissionsPromptPayload) => {
                confirm = confirmScopes;
              }
            });

            const scopes: IcrcScopesArray = [
              {
                scope: {
                  method: ICRC27_ACCOUNTS
                },
                state: ICRC25_PERMISSION_GRANTED
              }
            ];

            saveSessionScopes({
              owner: signerOptions.owner.getPrincipal(),
              origin: testOrigin,
              scopes
            });

            vi.advanceTimersByTime(SIGNER_PERMISSION_VALIDITY_PERIOD_IN_MILLISECONDS + 1);

            const messageEvent = new MessageEvent('message', requestPermissionsMsg);
            window.dispatchEvent(messageEvent);

            await vi.waitFor(() => {
              expect(confirm).not.toBeUndefined();
            });

            confirm?.([
              {
                scope: {method: ICRC49_CALL_CANISTER},
                state: IcrcPermissionStateSchema.enum.granted
              }
            ]);

            await vi.waitFor(() => {
              expect(postMessageMock).toHaveBeenCalledWith(
                {
                  jsonrpc: JSON_RPC_VERSION_2,
                  id: testId,
                  result: {
                    scopes: [
                      {
                        scope: {method: ICRC49_CALL_CANISTER},
                        state: IcrcPermissionStateSchema.enum.granted
                      },
                      // Session scopes are outdated therefore provided as ask_on_use
                      ...scopes.map(({state: _, ...rest}) => ({
                        ...rest,
                        state: ICRC25_PERMISSION_ASK_ON_USE
                      })),
                      // Make the test future prone in case we add more scopes to the library
                      ...SIGNER_DEFAULT_SCOPES.filter(
                        ({scope: {method}}) =>
                          method !== ICRC27_ACCOUNTS && method !== ICRC49_CALL_CANISTER
                      )
                    ]
                  }
                },
                testOrigin
              );
            });

            del({key: `oisy_signer_${testOrigin}_${owner.getPrincipal().toText()}`});
          });

          describe('Busy', () => {
            let messageEvent: MessageEvent;

            beforeEach(async () => {
              const {messageEvent: m} = await prepareConfirm();
              messageEvent = m;
            });

            it('should reject if busy', async () => {
              // Sending a second request should lead to busy given that the confirm is not handled
              window.dispatchEvent(messageEvent);

              await vi.waitFor(() => {
                expect(postMessageMock).toHaveBeenLastCalledWith(
                  {
                    jsonrpc: JSON_RPC_VERSION_2,
                    id: testId,
                    error: {
                      code: SignerErrorCode.BUSY,
                      message:
                        'The signer is currently processing a request and cannot handle new requests at this time.'
                    }
                  },
                  testOrigin
                );
              });
            });

            assertReadOnlyIfBusy();
          });

          it('should reset to idle', async () => {
            const {confirm} = await prepareConfirm();

            const spy = vi.spyOn(signer as unknown as {setIdle: () => void}, 'setIdle');

            confirm?.([
              {
                scope: {method: ICRC49_CALL_CANISTER},
                state: IcrcPermissionStateSchema.enum.granted
              }
            ]);

            await vi.waitFor(() => expect(spy).toHaveBeenCalledOnce());
          });
        });
      });

      describe('With prompts', () => {
        const requestAccountsData: IcrcAccountsRequest = {
          id: testId,
          jsonrpc: JSON_RPC_VERSION_2,
          method: ICRC27_ACCOUNTS
        };

        const requestCallCanisterData: IcrcCallCanisterRequest = {
          id: testId,
          jsonrpc: JSON_RPC_VERSION_2,
          method: ICRC49_CALL_CANISTER,
          params: {
            ...mockCallCanisterParams,
            sender: owner.getPrincipal().toText()
          }
        };

        const requestCallCanisterMsg = {
          data: requestCallCanisterData,
          origin: testOrigin
        };

        const testParams = [
          {method: 'icrc27_accounts' as IcrcScopedMethod, requestData: requestAccountsData},
          {method: 'icrc49_call_canister' as IcrcScopedMethod, requestData: requestCallCanisterData}
        ];

        afterEach(() => {
          del({key: `oisy_signer_${testOrigin}_${signerOptions.owner.getPrincipal().toText()}`});
        });

        describe.each(testParams)('$method', ({method, requestData}) => {
          describe('Not ready', () => {
            it('should notify connection is not yet established', () => {
              const messageEvent = new MessageEvent('message', {
                data: requestData,
                origin: testOrigin
              });
              window.dispatchEvent(messageEvent);

              expect(postMessageMock).toHaveBeenCalledWith(
                {
                  jsonrpc: JSON_RPC_VERSION_2,
                  id: testId,
                  error: {
                    code: SignerErrorCode.ORIGIN_ERROR,
                    message: 'The relying party has not established a connection to the signer.'
                  }
                },
                testOrigin
              );
            });
          });

          describe('Ready', () => {
            const requestMsg = {
              data: requestData,
              origin: testOrigin
            };

            beforeEach(async () => {
              await initWalletReady();
            });

            it('should notify missing prompt', async () => {
              const messageEvent = new MessageEvent('message', requestMsg);
              window.dispatchEvent(messageEvent);

              await vi.waitFor(() => {
                expect(postMessageMock).toHaveBeenLastCalledWith(
                  {
                    jsonrpc: JSON_RPC_VERSION_2,
                    id: testId,
                    error: {
                      code: SignerErrorCode.PERMISSIONS_PROMPT_NOT_REGISTERED,
                      message:
                        'The signer has not registered a prompt to respond to permission requests.'
                    }
                  },
                  testOrigin
                );
              });
            });

            it('should reject request if permissions were already denied', async () => {
              const promptSpy = vi.fn();

              signer.register({
                method: ICRC25_REQUEST_PERMISSIONS,
                prompt: promptSpy
              });

              saveSessionScopes({
                owner: signerOptions.owner.getPrincipal(),
                origin: testOrigin,
                scopes: [
                  {
                    scope: {method},
                    state: IcrcPermissionStateSchema.enum.denied
                  }
                ]
              });

              const messageEvent = new MessageEvent('message', requestMsg);
              window.dispatchEvent(messageEvent);

              await vi.waitFor(() => {
                expect(postMessageMock).toHaveBeenLastCalledWith(
                  {
                    jsonrpc: JSON_RPC_VERSION_2,
                    id: testId,
                    error: {
                      code: SignerErrorCode.PERMISSION_NOT_GRANTED,
                      message:
                        'The signer has not granted the necessary permissions to process the request from the relying party.'
                    }
                  },
                  testOrigin
                );
              });

              promptSpy.mockClear();
            });

            it(`should prompt for permissions if ${method} currently matches ask_on_use - has not yet permissions set`, async () => {
              const promptSpy = vi.fn();

              signer.register({
                method: ICRC25_REQUEST_PERMISSIONS,
                prompt: promptSpy
              });

              const messageEvent = new MessageEvent('message', requestMsg);
              window.dispatchEvent(messageEvent);

              await vi.waitFor(() => {
                expect(promptSpy).toHaveBeenCalledWith({
                  requestedScopes: [
                    {
                      scope: {method},
                      state: IcrcPermissionStateSchema.enum.denied
                    }
                  ],
                  confirm: expect.any(Function),
                  origin: testOrigin
                });
              });

              promptSpy.mockClear();
            });

            it('should save granted permission after prompt for permissions', async () => {
              let confirm: PermissionsConfirmation | undefined;

              signer.register({
                method: ICRC25_REQUEST_PERMISSIONS,
                prompt: ({
                  confirm: confirmScopes,
                  requestedScopes: _
                }: PermissionsPromptPayload) => {
                  confirm = confirmScopes;
                }
              });

              const messageEvent = new MessageEvent('message', requestMsg);
              window.dispatchEvent(messageEvent);

              await vi.waitFor(() => {
                expect(confirm).not.toBeUndefined();
              });

              confirm?.([
                {
                  scope: {method},
                  state: IcrcPermissionStateSchema.enum.granted
                }
              ]);

              await vi.waitFor(() => {
                const storedScopes: SessionPermissions | undefined = get({
                  key: `oisy_signer_${testOrigin}_${signerOptions.owner.getPrincipal().toText()}`
                });

                expect(storedScopes).not.toBeUndefined();

                expect(storedScopes?.scopes).toEqual([
                  {
                    scope: {method},
                    state: IcrcPermissionStateSchema.enum.granted,
                    createdAt: expect.any(Number),
                    updatedAt: expect.any(Number)
                  }
                ]);
              });
            });

            it('should notify error after prompt for permissions', async () => {
              let confirm: PermissionsConfirmation | undefined;

              signer.register({
                method: ICRC25_REQUEST_PERMISSIONS,
                prompt: ({
                  confirm: confirmScopes,
                  requestedScopes: _
                }: PermissionsPromptPayload) => {
                  confirm = confirmScopes;
                }
              });

              const messageEvent = new MessageEvent('message', requestMsg);
              window.dispatchEvent(messageEvent);

              await vi.waitFor(() => {
                expect(confirm).not.toBeUndefined();
              });

              confirm?.([
                {
                  scope: {method},
                  state: IcrcPermissionStateSchema.enum.denied
                }
              ]);

              await vi.waitFor(() => {
                expect(postMessageMock).toHaveBeenLastCalledWith(
                  {
                    jsonrpc: JSON_RPC_VERSION_2,
                    id: testId,
                    error: {
                      code: SignerErrorCode.PERMISSION_NOT_GRANTED,
                      message:
                        'The signer has not granted the necessary permissions to process the request from the relying party.'
                    }
                  },
                  testOrigin
                );
              });
            });

            it('should also notify error after prompt if no scopes is confirmed', async () => {
              let confirm: PermissionsConfirmation | undefined;

              signer.register({
                method: ICRC25_REQUEST_PERMISSIONS,
                prompt: ({
                  confirm: confirmScopes,
                  requestedScopes: _
                }: PermissionsPromptPayload) => {
                  confirm = confirmScopes;
                }
              });

              const messageEvent = new MessageEvent('message', requestMsg);
              window.dispatchEvent(messageEvent);

              await vi.waitFor(() => {
                expect(confirm).not.toBeUndefined();
              });

              confirm?.([]);

              await vi.waitFor(() => {
                expect(postMessageMock).toHaveBeenLastCalledWith(
                  {
                    jsonrpc: JSON_RPC_VERSION_2,
                    id: testId,
                    error: {
                      code: SignerErrorCode.PERMISSION_NOT_GRANTED,
                      message:
                        'The signer has not granted the necessary permissions to process the request from the relying party.'
                    }
                  },
                  testOrigin
                );
              });
            });
          });
        });

        describe('Accounts', () => {
          const requestAccountsMsg = {
            data: requestAccountsData,
            origin: testOrigin
          };

          describe('Not ready', () => {
            it('should notify connection is not yet established', () => {
              const messageEvent = new MessageEvent('message', {
                data: requestAccountsData,
                origin: testOrigin
              });
              window.dispatchEvent(messageEvent);

              expect(postMessageMock).toHaveBeenCalledWith(
                {
                  jsonrpc: JSON_RPC_VERSION_2,
                  id: testId,
                  error: {
                    code: SignerErrorCode.ORIGIN_ERROR,
                    message: 'The relying party has not established a connection to the signer.'
                  }
                },
                testOrigin
              );
            });
          });

          describe('Ready', () => {
            const prepareApprove = async (): Promise<{
              messageEvent: MessageEvent;
              approve: AccountsApproval | undefined;
            }> => {
              let approve: AccountsApproval | undefined;

              signer.register({
                method: ICRC27_ACCOUNTS,
                prompt: ({approve: confirm}: AccountsPromptPayload) => {
                  approve = confirm;
                }
              });

              saveSessionScopes({
                owner: signerOptions.owner.getPrincipal(),
                origin: testOrigin,
                scopes: [
                  {
                    scope: {method: ICRC27_ACCOUNTS},
                    state: IcrcPermissionStateSchema.enum.granted
                  }
                ]
              });

              const messageEvent = new MessageEvent('message', requestAccountsMsg);
              window.dispatchEvent(messageEvent);

              await vi.waitFor(() => {
                expect(approve).not.toBeUndefined();
              });

              return {messageEvent, approve};
            };

            beforeEach(async () => {
              await initWalletReady();
            });

            it('should notify account for icrc27_accounts if permissions were already granted', async () => {
              const {approve} = await prepareApprove();

              approve?.(mockAccounts);

              await vi.waitFor(() => {
                expect(postMessageMock).toHaveBeenLastCalledWith(
                  {
                    jsonrpc: JSON_RPC_VERSION_2,
                    id: testId,
                    result: {
                      accounts: mockAccounts
                    }
                  },
                  testOrigin
                );
              });
            });

            it('should notify accounts after prompt for icrc27_accounts permissions', async () => {
              let confirmScopes: PermissionsConfirmation | undefined;
              let approveAccounts: AccountsApproval | undefined;

              signer.register({
                method: ICRC25_REQUEST_PERMISSIONS,
                prompt: ({confirm, requestedScopes: _}: PermissionsPromptPayload) => {
                  confirmScopes = confirm;
                }
              });

              signer.register({
                method: ICRC27_ACCOUNTS,
                prompt: ({approve}: AccountsPromptPayload) => {
                  approveAccounts = approve;
                }
              });

              const messageEvent = new MessageEvent('message', requestAccountsMsg);
              window.dispatchEvent(messageEvent);

              await vi.waitFor(() => {
                expect(confirmScopes).not.toBeUndefined();
              });

              confirmScopes?.([
                {
                  scope: {method: ICRC27_ACCOUNTS},
                  state: IcrcPermissionStateSchema.enum.granted
                }
              ]);

              await vi.waitFor(() => {
                expect(approveAccounts).not.toBeUndefined();
              });

              approveAccounts?.(mockAccounts);

              await vi.waitFor(() => {
                expect(postMessageMock).toHaveBeenLastCalledWith(
                  {
                    jsonrpc: JSON_RPC_VERSION_2,
                    id: testId,
                    result: {
                      accounts: mockAccounts
                    }
                  },
                  testOrigin
                );
              });
            });

            it('should reject for icrc27_accounts if permissions were already granted', async () => {
              let reject: Rejection | undefined;

              signer.register({
                method: ICRC27_ACCOUNTS,
                prompt: ({reject: confirm}: AccountsPromptPayload) => {
                  reject = confirm;
                }
              });

              saveSessionScopes({
                owner: signerOptions.owner.getPrincipal(),
                origin: testOrigin,
                scopes: [
                  {
                    scope: {method: ICRC27_ACCOUNTS},
                    state: IcrcPermissionStateSchema.enum.granted
                  }
                ]
              });

              const messageEvent = new MessageEvent('message', requestAccountsMsg);
              window.dispatchEvent(messageEvent);

              await vi.waitFor(() => {
                expect(reject).not.toBeUndefined();
              });

              reject?.();

              await vi.waitFor(() => {
                expect(postMessageMock).toHaveBeenLastCalledWith(
                  {
                    jsonrpc: JSON_RPC_VERSION_2,
                    id: testId,
                    error: mockErrorNotify
                  },
                  testOrigin
                );
              });
            });

            it('should reject after prompt for icrc27_accounts permissions', async () => {
              let confirmScopes: PermissionsConfirmation | undefined;
              let rejectAccounts: Rejection | undefined;

              signer.register({
                method: ICRC25_REQUEST_PERMISSIONS,
                prompt: ({confirm, requestedScopes: _}: PermissionsPromptPayload) => {
                  confirmScopes = confirm;
                }
              });

              signer.register({
                method: ICRC27_ACCOUNTS,
                prompt: ({reject}: AccountsPromptPayload) => {
                  rejectAccounts = reject;
                }
              });

              const messageEvent = new MessageEvent('message', requestAccountsMsg);
              window.dispatchEvent(messageEvent);

              await vi.waitFor(() => {
                expect(confirmScopes).not.toBeUndefined();
              });

              confirmScopes?.([
                {
                  scope: {method: ICRC27_ACCOUNTS},
                  state: IcrcPermissionStateSchema.enum.granted
                }
              ]);

              await vi.waitFor(() => {
                expect(rejectAccounts).not.toBeUndefined();
              });

              rejectAccounts?.();

              await vi.waitFor(() => {
                expect(postMessageMock).toHaveBeenLastCalledWith(
                  {
                    jsonrpc: JSON_RPC_VERSION_2,
                    id: testId,
                    error: mockErrorNotify
                  },
                  testOrigin
                );
              });
            });

            describe('Busy', () => {
              let messageEvent: MessageEvent;

              beforeEach(async () => {
                const {messageEvent: m} = await prepareApprove();
                messageEvent = m;
              });

              it('should reject if busy', async () => {
                // Sending a second request should lead to busy given that the approve is not handled
                window.dispatchEvent(messageEvent);

                await vi.waitFor(() => {
                  expect(postMessageMock).toHaveBeenLastCalledWith(
                    {
                      jsonrpc: JSON_RPC_VERSION_2,
                      id: testId,
                      error: {
                        code: SignerErrorCode.BUSY,
                        message:
                          'The signer is currently processing a request and cannot handle new requests at this time.'
                      }
                    },
                    testOrigin
                  );
                });
              });

              assertReadOnlyIfBusy();
            });

            it('should reset to idle', async () => {
              const {approve} = await prepareApprove();

              const spy = vi.spyOn(signer as unknown as {setIdle: () => void}, 'setIdle');

              approve?.(mockAccounts);

              await vi.waitFor(() => expect(spy).toHaveBeenCalledOnce());
            });
          });
        });

        describe('Call canister', () => {
          describe('Not ready', () => {
            it('should notify connection is not yet established', () => {
              const messageEvent = new MessageEvent('message', {
                data: requestCallCanisterData,
                origin: testOrigin
              });
              window.dispatchEvent(messageEvent);

              expect(postMessageMock).toHaveBeenCalledWith(
                {
                  jsonrpc: JSON_RPC_VERSION_2,
                  id: testId,
                  error: {
                    code: SignerErrorCode.ORIGIN_ERROR,
                    message: 'The relying party has not established a connection to the signer.'
                  }
                },
                testOrigin
              );
            });
          });

          describe('Ready', () => {
            let spyConsentMessage: MockInstance;

            beforeEach(async () => {
              spyConsentMessage = vi.spyOn(Icrc21Canister.prototype, 'consentMessage');

              await initWalletReady();
            });

            describe('Consent message', () => {
              let notifyErrorSpy: MockInstance;

              beforeEach(() => {
                notifyErrorSpy = vi.spyOn(signerHandlers, 'notifyError');
              });

              describe('Call canister success', () => {
                const prepareConfirm = async (): Promise<{
                  confirm: PermissionsConfirmation | undefined;
                  messageEvent: MessageEvent;
                  promptSpy: MockInstance;
                }> => {
                  let confirm: PermissionsConfirmation | undefined;
                  const promptSpy = vi.fn();

                  signer.register({
                    method: ICRC25_REQUEST_PERMISSIONS,
                    prompt: ({
                      confirm: confirmScopes,
                      requestedScopes: _
                    }: PermissionsPromptPayload) => {
                      confirm = confirmScopes;
                    }
                  });

                  signer.register({
                    method: ICRC21_CALL_CONSENT_MESSAGE,
                    prompt: promptSpy
                  });

                  const messageEvent = new MessageEvent('message', requestCallCanisterMsg);
                  window.dispatchEvent(messageEvent);

                  await vi.waitFor(() => {
                    expect(confirm).not.toBeUndefined();
                  });

                  return {confirm, messageEvent, promptSpy};
                };

                beforeEach(() => {
                  spyConsentMessage.mockResolvedValue({
                    Ok: mockConsentInfo
                  });
                });

                it('should prompt consent message for icrc49_call_canister if permissions were already granted', async () => {
                  const promptSpy = vi.fn();

                  signer.register({
                    method: ICRC21_CALL_CONSENT_MESSAGE,
                    prompt: promptSpy
                  });

                  saveSessionScopes({
                    owner: signerOptions.owner.getPrincipal(),
                    origin: testOrigin,
                    scopes: [
                      {
                        scope: {method: ICRC49_CALL_CANISTER},
                        state: IcrcPermissionStateSchema.enum.granted
                      }
                    ]
                  });

                  const messageEvent = new MessageEvent('message', requestCallCanisterMsg);
                  window.dispatchEvent(messageEvent);

                  await vi.waitFor(() => {
                    // Loading + result
                    expect(promptSpy).toHaveBeenCalledTimes(2);
                  });
                });

                it('should prompt consent message after prompt for icrc49_call_canister permissions', async () => {
                  const {confirm, promptSpy} = await prepareConfirm();

                  confirm?.([
                    {
                      scope: {method: ICRC49_CALL_CANISTER},
                      state: IcrcPermissionStateSchema.enum.granted
                    }
                  ]);

                  await vi.waitFor(() => {
                    // Loading + result
                    expect(promptSpy).toHaveBeenCalledTimes(2);
                  });
                });

                it('should notify aborted error for icrc49_call_canister if user reject consent', async () => {
                  let reject: Rejection | undefined;

                  const prompt = ({status, ...rest}: ConsentMessagePromptPayload): void => {
                    if (status === 'result' && 'reject' in rest) {
                      ({reject} = rest);
                    }
                  };

                  signer.register({
                    method: ICRC21_CALL_CONSENT_MESSAGE,
                    prompt
                  });

                  saveSessionScopes({
                    owner: signerOptions.owner.getPrincipal(),
                    origin: testOrigin,
                    scopes: [
                      {
                        scope: {method: ICRC49_CALL_CANISTER},
                        state: IcrcPermissionStateSchema.enum.granted
                      }
                    ]
                  });

                  const messageEvent = new MessageEvent('message', requestCallCanisterMsg);
                  window.dispatchEvent(messageEvent);

                  await vi.waitFor(() => {
                    expect(reject).not.toBeUndefined();
                  });

                  reject?.();

                  await vi.waitFor(() => {
                    expect(notifyErrorSpy).toHaveBeenCalledWith({
                      id: testId,
                      origin: testOrigin,
                      error: mockErrorNotify
                    });
                  });
                });

                describe('Busy', () => {
                  let messageEvent: MessageEvent;

                  beforeEach(async () => {
                    const {messageEvent: m} = await prepareConfirm();
                    messageEvent = m;
                  });

                  it('should reject if busy', async () => {
                    // Sending a second request should lead to busy given that the confirm is not handled
                    window.dispatchEvent(messageEvent);

                    await vi.waitFor(() => {
                      expect(postMessageMock).toHaveBeenLastCalledWith(
                        {
                          jsonrpc: JSON_RPC_VERSION_2,
                          id: testId,
                          error: {
                            code: SignerErrorCode.BUSY,
                            message:
                              'The signer is currently processing a request and cannot handle new requests at this time.'
                          }
                        },
                        testOrigin
                      );
                    });
                  });

                  assertReadOnlyIfBusy();
                });
              });

              describe('Call canister error', () => {
                const error = {GenericError: {description: 'Error', error_code: 1n}};

                beforeEach(() => {
                  spyConsentMessage.mockResolvedValue({
                    Err: error
                  });
                });

                it('should not prompt consent message for icrc49_call_canister if getting message throws an error', async () => {
                  const promptSpy = vi.fn();

                  signer.register({
                    method: ICRC21_CALL_CONSENT_MESSAGE,
                    prompt: promptSpy
                  });

                  saveSessionScopes({
                    owner: signerOptions.owner.getPrincipal(),
                    origin: testOrigin,
                    scopes: [
                      {
                        scope: {method: ICRC49_CALL_CANISTER},
                        state: IcrcPermissionStateSchema.enum.granted
                      }
                    ]
                  });

                  const messageEvent = new MessageEvent('message', requestCallCanisterMsg);
                  window.dispatchEvent(messageEvent);

                  await vi.waitFor(() => {
                    expect(notifyErrorSpy).toHaveBeenCalledWith({
                      id: testId,
                      origin: testOrigin,
                      error: {
                        code: SignerErrorCode.REQUEST_NOT_SUPPORTED,
                        message: mapIcrc21ErrorToString(error)
                      }
                    });
                  });

                  expect(promptSpy).not.toHaveBeenCalledOnce();
                });
              });
            });

            describe('Execute call', () => {
              let spyCanisterCall: MockInstance;

              const requestCallCanisterMessageEvent = new MessageEvent(
                'message',
                requestCallCanisterMsg
              );

              beforeEach(() => {
                vi.resetModules();
              });

              describe('No call without consent message first', () => {
                beforeEach(() => {
                  spyCanisterCall = vi
                    .spyOn(SignerApi.prototype, 'call')
                    .mockImplementation(vi.fn());

                  spyConsentMessage.mockResolvedValue({
                    Ok: mockConsentInfo
                  });
                });

                it('should not call if consent message is pending even if permissions were already granted', async () => {
                  const promptSpy = vi.fn();

                  signer.register({
                    method: ICRC21_CALL_CONSENT_MESSAGE,
                    prompt: promptSpy
                  });

                  saveSessionScopes({
                    owner: signerOptions.owner.getPrincipal(),
                    origin: testOrigin,
                    scopes: [
                      {
                        scope: {method: ICRC49_CALL_CANISTER},
                        state: IcrcPermissionStateSchema.enum.granted
                      }
                    ]
                  });

                  const messageEvent = new MessageEvent('message', requestCallCanisterMsg);
                  window.dispatchEvent(messageEvent);

                  await vi.waitFor(() => {
                    // Loading + result
                    expect(promptSpy).toHaveBeenCalledTimes(2);
                  });

                  expect(spyCanisterCall).not.toHaveBeenCalled();
                });

                it('should not call if consent message is pending even if permissions were literally approved', async () => {
                  let confirm: PermissionsConfirmation | undefined;
                  const promptSpy = vi.fn();

                  signer.register({
                    method: ICRC25_REQUEST_PERMISSIONS,
                    prompt: ({
                      confirm: confirmScopes,
                      requestedScopes: _
                    }: PermissionsPromptPayload) => {
                      confirm = confirmScopes;
                    }
                  });

                  signer.register({
                    method: ICRC21_CALL_CONSENT_MESSAGE,
                    prompt: promptSpy
                  });

                  const messageEvent = new MessageEvent('message', requestCallCanisterMsg);
                  window.dispatchEvent(messageEvent);

                  await vi.waitFor(() => {
                    expect(confirm).not.toBeUndefined();
                  });

                  confirm?.([
                    {
                      scope: {method: ICRC49_CALL_CANISTER},
                      state: IcrcPermissionStateSchema.enum.granted
                    }
                  ]);

                  await vi.waitFor(() => {
                    // Loading + result
                    expect(promptSpy).toHaveBeenCalledTimes(2);
                  });

                  expect(spyCanisterCall).not.toHaveBeenCalled();
                });

                it('should not call if consent message is rejected', async () => {
                  let reject: Rejection | undefined;

                  const prompt = ({status, ...rest}: ConsentMessagePromptPayload): void => {
                    if (status === 'result' && 'reject' in rest) {
                      ({reject} = rest);
                    }
                  };

                  signer.register({
                    method: ICRC21_CALL_CONSENT_MESSAGE,
                    prompt
                  });

                  saveSessionScopes({
                    owner: signerOptions.owner.getPrincipal(),
                    origin: testOrigin,
                    scopes: [
                      {
                        scope: {method: ICRC49_CALL_CANISTER},
                        state: IcrcPermissionStateSchema.enum.granted
                      }
                    ]
                  });

                  const messageEvent = new MessageEvent('message', requestCallCanisterMsg);
                  window.dispatchEvent(messageEvent);

                  await vi.waitFor(() => {
                    expect(reject).not.toBeUndefined();
                  });

                  reject?.();

                  expect(spyCanisterCall).not.toHaveBeenCalled();
                });
              });

              describe('Consent approved', () => {
                const prepareApprove = async (): Promise<ConsentMessageApproval | undefined> => {
                  let approve: ConsentMessageApproval | undefined;

                  const prompt = ({status, ...rest}: ConsentMessagePromptPayload): void => {
                    if (status === 'result' && 'reject' in rest) {
                      ({approve} = rest);
                    }
                  };

                  signer.register({
                    method: ICRC21_CALL_CONSENT_MESSAGE,
                    prompt
                  });

                  saveSessionScopes({
                    owner: signerOptions.owner.getPrincipal(),
                    origin: testOrigin,
                    scopes: [
                      {
                        scope: {method: ICRC49_CALL_CANISTER},
                        state: IcrcPermissionStateSchema.enum.granted
                      }
                    ]
                  });

                  spyConsentMessage.mockResolvedValue({
                    Ok: mockConsentInfo
                  });

                  window.dispatchEvent(requestCallCanisterMessageEvent);

                  await vi.waitFor(() => {
                    expect(approve).not.toBeUndefined();
                  });

                  return approve;
                };

                const approveAndCall = async (): Promise<void> => {
                  const approve = await prepareApprove();

                  approve?.();
                };

                describe('Call success', () => {
                  let notifyCallCanisterSpy: MockInstance;
                  let spySetIdle: MockInstance;

                  beforeEach(async () => {
                    spySetIdle = vi.spyOn(signer as unknown as {setIdle: () => void}, 'setIdle');

                    spyCanisterCall = vi
                      .spyOn(SignerApi.prototype, 'call')
                      .mockResolvedValue(mockCallCanisterSuccess);

                    notifyCallCanisterSpy = vi.spyOn(signerSuccessHandlers, 'notifyCallCanister');

                    await approveAndCall();
                  });

                  it('should call canister and notify success', () => {
                    expect(spyCanisterCall).toHaveBeenCalledExactlyOnceWith({
                      ...signerOptions,
                      params: {
                        ...mockCallCanisterParams,
                        sender: owner.getPrincipal().toText()
                      }
                    });

                    expect(notifyCallCanisterSpy).toHaveBeenCalledWith({
                      id: testId,
                      origin: testOrigin,
                      result: mockCallCanisterSuccess
                    });
                  });

                  it('should reset to idle', async () => {
                    // Signer checks if accounts and handle permissions should be handled before call canister and we currently always reset to idle
                    await vi.waitFor(() => expect(spySetIdle).toHaveBeenCalledTimes(3));
                  });
                });

                describe('Call error', () => {
                  let notifyErrorSpy: MockInstance;
                  const errorMsg = 'Test error';

                  beforeEach(async () => {
                    spyCanisterCall = vi
                      .spyOn(SignerApi.prototype, 'call')
                      .mockRejectedValue(new Error(errorMsg));

                    notifyErrorSpy = vi.spyOn(signerHandlers, 'notifyError');

                    await approveAndCall();
                  });

                  it('should call canister and notify error', () => {
                    expect(spyCanisterCall).toHaveBeenCalledExactlyOnceWith({
                      ...signerOptions,
                      params: {
                        ...mockCallCanisterParams,
                        sender: owner.getPrincipal().toText()
                      }
                    });

                    expect(notifyErrorSpy).toHaveBeenCalledWith({
                      id: testId,
                      origin: testOrigin,
                      error: {
                        code: SignerErrorCode.NETWORK_ERROR,
                        message: errorMsg
                      }
                    });
                  });
                });

                describe('Busy', () => {
                  beforeEach(async () => {
                    spyCanisterCall = vi
                      .spyOn(SignerApi.prototype, 'call')
                      .mockResolvedValue(mockCallCanisterSuccess);

                    await prepareApprove();
                  });

                  it('should reject if busy', async () => {
                    // Sending a second request should lead to busy given that the confirm is not handled
                    window.dispatchEvent(requestCallCanisterMessageEvent);

                    await vi.waitFor(() => {
                      expect(postMessageMock).toHaveBeenLastCalledWith(
                        {
                          jsonrpc: JSON_RPC_VERSION_2,
                          id: testId,
                          error: {
                            code: SignerErrorCode.BUSY,
                            message:
                              'The signer is currently processing a request and cannot handle new requests at this time.'
                          }
                        },
                        testOrigin
                      );
                    });
                  });

                  assertReadOnlyIfBusy();
                });
              });
            });
          });
        });
      });

      describe('Unknown standard', () => {
        beforeEach(async () => {
          await initWalletReady();
        });

        it('should notify REQUEST_NOT_SUPPORTED for unknown standard', async () => {
          const testOrigin = 'https://hello.com';

          const msg = {
            data: {
              id: testId,
              jsonrpc: JSON_RPC_VERSION_2,
              method: 'this_is_not_supported'
            },
            origin: testOrigin
          };

          const messageEvent = new MessageEvent('message', msg);
          window.dispatchEvent(messageEvent);

          await vi.waitFor(() => {
            expect(postMessageMock).toHaveBeenCalledWith(
              {
                jsonrpc: JSON_RPC_VERSION_2,
                id: testId,
                error: {
                  code: SignerErrorCode.REQUEST_NOT_SUPPORTED,
                  message: 'The request sent by the relying party is not supported by the signer.'
                }
              },
              testOrigin
            );
          });
        });
      });

      describe('Confirm permissions', () => {
        const scopes: IcrcScopesArray = [
          {
            scope: {
              method: ICRC27_ACCOUNTS
            },
            state: ICRC25_PERMISSION_GRANTED
          },
          {
            scope: {
              method: ICRC49_CALL_CANISTER
            },
            state: ICRC25_PERMISSION_DENIED
          }
        ];

        const msg = {
          data: {
            id: requestPermissionsData.id,
            jsonrpc: JSON_RPC_VERSION_2,
            method: {
              scopes
            }
          },
          origin: testOrigin
        };

        let notifyReadySpy: MockInstance;

        let payload: PermissionsPromptPayload;

        beforeEach(() => {
          notifyReadySpy = vi.spyOn(signerSuccessHandlers, 'notifyReady');

          const messageEvent = new MessageEvent('message', {
            data: {
              id: testId,
              jsonrpc: JSON_RPC_VERSION_2,
              method: ICRC29_STATUS
            },
            origin: testOrigin
          });

          window.dispatchEvent(messageEvent);

          // eslint-disable-next-line vitest/no-standalone-expect
          expect(notifyReadySpy).toHaveBeenCalledWith({
            id: testId,
            origin: testOrigin
          });

          signer.register({
            method: ICRC25_REQUEST_PERMISSIONS,
            prompt: (p: PermissionsPromptPayload) => (payload = p)
          });

          const messageEventPermissionsRequests = new MessageEvent(
            'message',
            requestPermissionsMsg
          );
          window.dispatchEvent(messageEventPermissionsRequests);
        });

        it('should notify scopes for selected permissions', async () => {
          payload.confirm(scopes);

          await vi.waitFor(() => {
            expect(postMessageMock).toHaveBeenCalledWith(
              {
                jsonrpc: JSON_RPC_VERSION_2,
                id: msg.data.id,
                result: {
                  scopes
                }
              },
              testOrigin
            );
          });
        });

        it('should save permissions in storage', async () => {
          payload.confirm(scopes);

          const expectedKey = `oisy_signer_${testOrigin}_${signerOptions.owner.getPrincipal().toText()}`;
          const expectedData = {
            scopes: scopes.map((scope) => ({
              ...scope,
              createdAt: expect.any(Number),
              updatedAt: expect.any(Number)
            })),
            createdAt: expect.any(Number),
            updatedAt: expect.any(Number)
          };

          await vi.waitFor(() => {
            const storedData = get({key: expectedKey});

            expect(storedData).toStrictEqual(expectedData);
          });
        });
      });
    });

    describe('With custom options', () => {
      let signerWithOptions: Signer;

      const sessionPermissionExpirationInMilliseconds = 500;

      beforeEach(() => {
        signerWithOptions = Signer.init({
          ...signerOptions,
          sessionOptions: {
            sessionPermissionExpirationInMilliseconds
          }
        });
      });

      afterEach(() => {
        signerWithOptions.disconnect();
      });

      describe('Ready', () => {
        beforeEach(async () => {
          vi.useFakeTimers();

          await initWalletReady();
        });

        afterEach(() => {
          vi.useRealTimers();
        });

        describe('Permissions', () => {
          const owner = signerOptions.owner.getPrincipal();

          const scopes: IcrcScopesArray = [
            {
              scope: {
                method: ICRC27_ACCOUNTS
              },
              state: ICRC25_PERMISSION_GRANTED
            }
          ];

          it('should notify permissions granted if still not expired', () => {
            saveSessionScopes({
              owner,
              origin: testOrigin,
              scopes
            });

            vi.advanceTimersByTime(sessionPermissionExpirationInMilliseconds - 1);

            const messageEvent = new MessageEvent('message', requestPermissions);
            window.dispatchEvent(messageEvent);

            expect(postMessageMock).toHaveBeenCalledWith(
              {
                jsonrpc: JSON_RPC_VERSION_2,
                id: testId,
                result: {
                  scopes: [
                    ...scopes,
                    ...SIGNER_DEFAULT_SCOPES.filter(
                      ({scope: {method}}) => method !== ICRC27_ACCOUNTS
                    )
                  ]
                }
              },
              testOrigin
            );

            del({key: `oisy_signer_${testOrigin}_${owner.toText()}`});
          });

          it('should notify expired permissions with ask_on_use', () => {
            saveSessionScopes({
              owner,
              origin: testOrigin,
              scopes
            });

            vi.advanceTimersByTime(sessionPermissionExpirationInMilliseconds + 1);

            const messageEvent = new MessageEvent('message', requestPermissions);
            window.dispatchEvent(messageEvent);

            expect(postMessageMock).toHaveBeenCalledWith(
              {
                jsonrpc: JSON_RPC_VERSION_2,
                id: testId,
                result: {
                  scopes: [
                    ...scopes.map(({state: _, ...rest}) => ({
                      ...rest,
                      state: ICRC25_PERMISSION_ASK_ON_USE
                    })),
                    ...SIGNER_DEFAULT_SCOPES.filter(
                      ({scope: {method}}) => method !== ICRC27_ACCOUNTS
                    )
                  ]
                }
              },
              testOrigin
            );

            del({key: `oisy_signer_${testOrigin}_${owner.toText()}`});
          });
        });
      });
    });
  });

  describe('Prompts', () => {
    let signer: Signer;

    beforeEach(() => {
      signer = Signer.init(signerOptions);
    });

    afterEach(() => {
      signer.disconnect();

      vi.clearAllMocks();
      vi.restoreAllMocks();
    });

    it('should validate a permissions prompt on register', () => {
      const mockPermissionsPrompt = vi.fn();

      const spy = vi.spyOn(PermissionsPromptSchema, 'parse');

      expect(() => {
        signer.register({
          method: ICRC25_REQUEST_PERMISSIONS,
          prompt: mockPermissionsPrompt
        });
      }).not.toThrowError();

      expect(spy).toHaveBeenCalledWith(mockPermissionsPrompt);
    });

    it('should validate an accounts prompt on register', () => {
      const mockAccountsPrompt = vi.fn();

      const spy = vi.spyOn(AccountsPromptSchema, 'parse');

      expect(() => {
        signer.register({
          method: ICRC27_ACCOUNTS,
          prompt: mockAccountsPrompt
        });
      }).not.toThrowError();

      expect(spy).toHaveBeenCalledWith(mockAccountsPrompt);
    });

    it('should validate a consent message prompt on register', () => {
      const mockConsentMessagePrompt = vi.fn();

      const spy = vi.spyOn(ConsentMessagePromptSchema, 'parse');

      expect(() => {
        signer.register({
          method: ICRC21_CALL_CONSENT_MESSAGE,
          prompt: mockConsentMessagePrompt
        });
      }).not.toThrowError();

      expect(spy).toHaveBeenCalledWith(mockConsentMessagePrompt);
    });

    it('should validate a call canister prompt on register', () => {
      const mockCallCanisterPrompt = vi.fn();

      const spy = vi.spyOn(CallCanisterPromptSchema, 'parse');

      expect(() => {
        signer.register({
          method: ICRC49_CALL_CANISTER,
          prompt: mockCallCanisterPrompt
        });
      }).not.toThrowError();

      expect(spy).toHaveBeenCalledWith(mockCallCanisterPrompt);
    });

    it('should throw on register if prompt not supported', () => {
      const mockPrompt = vi.fn();

      expect(() => {
        signer.register({
          // @ts-expect-error: we are testing this on purpose
          method: 'something',
          prompt: mockPrompt
        });
      }).toThrowError(
        'The specified method is not supported. Please ensure you are using a supported standard.'
      );
    });
  });
});
