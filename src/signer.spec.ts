import {Ed25519KeyIdentity} from '@dfinity/identity';
import type {MockInstance} from 'vitest';
import {Icrc21Canister} from './api/icrc21-canister.api';
import {SignerApi} from './api/signer.api';
import {
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
  IcrcRequestAnyPermissionsRequest
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
          assertAndSetOrigin: (params: {origin: Origin; msgData: SignerMessageEventData}) => void;
        },
        'assertAndSetOrigin'
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

      const messageEventDiff = new MessageEvent('message', {...msg, origin: differentOrigin});
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
      }).not.toThrow();
    });
  });

  describe('Exchange postMessage', () => {
    const testId = crypto.randomUUID();
    const testOrigin = 'https://hello.com';

    const requestPermissionsData: IcrcRequestAnyPermissionsRequest = {
      id: testId,
      jsonrpc: JSON_RPC_VERSION_2,
      method: ICRC25_REQUEST_PERMISSIONS,
      params: {
        scopes: [{method: ICRC49_CALL_CANISTER}, {method: ICRC27_ACCOUNTS}]
      }
    };

    const requestPermissionsDataSortedScopes = requestPermissionsData.params.scopes.sort(
      ({method: methodA}, {method: methodB}): number => methodA.localeCompare(methodB)
    );

    const requestPermissionsMsg = {
      data: requestPermissionsData,
      origin: testOrigin
    };

    let originalOpener: typeof window.opener;

    let signer: Signer;

    let postMessageMock: MockInstance;

    beforeEach(() => {
      signer = Signer.init(signerOptions);

      postMessageMock = vi.fn();

      vi.stubGlobal('opener', {postMessage: postMessageMock});
    });

    afterEach(() => {
      signer.disconnect();

      window.opener = originalOpener;

      vi.clearAllMocks();
      vi.restoreAllMocks();
    });

    describe('ready', () => {
      const msg = {
        data: {
          id: testId,
          jsonrpc: JSON_RPC_VERSION_2,
          method: ICRC29_STATUS
        },
        origin: testOrigin
      };

      let notifySupportedStandardsSpy: MockInstance;
      let notifyPermissionsSpy: MockInstance;
      let notifyErrorSpy: MockInstance;

      beforeEach(() => {
        notifySupportedStandardsSpy = vi.spyOn(signerSuccessHandlers, 'notifySupportedStandards');
        notifyPermissionsSpy = vi.spyOn(signerSuccessHandlers, 'notifyPermissionScopes');
        notifyErrorSpy = vi.spyOn(signerHandlers, 'notifyError');
      });

      it('should notify READY for icrc29_status', () => {
        const messageEvent = new MessageEvent('message', msg);
        window.dispatchEvent(messageEvent);

        expect(postMessageMock).toHaveBeenCalledWith(
          {
            jsonrpc: JSON_RPC_VERSION_2,
            id: testId,
            result: 'ready'
          },
          testOrigin
        );
      });

      it('should not notify any other messages than ready', () => {
        const messageEvent = new MessageEvent('message', msg);
        window.dispatchEvent(messageEvent);

        expect(notifySupportedStandardsSpy).not.toHaveBeenCalled();
        expect(notifyPermissionsSpy).not.toHaveBeenCalled();
        expect(notifyErrorSpy).not.toHaveBeenCalled();
      });
    });

    describe('Supported standards', () => {
      const msg = {
        data: {
          id: testId,
          jsonrpc: JSON_RPC_VERSION_2,
          method: ICRC25_SUPPORTED_STANDARDS
        },
        origin: testOrigin
      };

      let notifyReadySpy: MockInstance;
      let notifyPermissionsSpy: MockInstance;
      let notifyErrorSpy: MockInstance;

      beforeEach(() => {
        notifyReadySpy = vi.spyOn(signerSuccessHandlers, 'notifyReady');
        notifyPermissionsSpy = vi.spyOn(signerSuccessHandlers, 'notifyPermissionScopes');
        notifyErrorSpy = vi.spyOn(signerHandlers, 'notifyError');
      });

      it('should notify supported standards for icrc25_supported_standards', () => {
        const messageEvent = new MessageEvent('message', msg);
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

      it('should not notify any other messages than ready icrc25_supported_standards', () => {
        const messageEvent = new MessageEvent('message', msg);
        window.dispatchEvent(messageEvent);

        expect(notifyReadySpy).not.toHaveBeenCalled();
        expect(notifyPermissionsSpy).not.toHaveBeenCalled();
        expect(notifyErrorSpy).not.toHaveBeenCalled();
      });
    });

    describe('Permissions', () => {
      const msg = {
        data: {
          id: testId,
          jsonrpc: JSON_RPC_VERSION_2,
          method: ICRC25_PERMISSIONS
        },
        origin: testOrigin
      };

      let notifyReadySpy: MockInstance;
      let notifySupportedStandardsSpy: MockInstance;
      let notifyErrorSpy: MockInstance;

      beforeEach(() => {
        notifyReadySpy = vi.spyOn(signerSuccessHandlers, 'notifyReady');
        notifySupportedStandardsSpy = vi.spyOn(signerSuccessHandlers, 'notifySupportedStandards');
        notifyErrorSpy = vi.spyOn(signerHandlers, 'notifyError');
      });

      it('should notify default permissions for icrc25_permissions', () => {
        const messageEvent = new MessageEvent('message', msg);
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

      it('should notify permissions already confirmed and saved in local storage for icrc25_permissions', () => {
        const owner = Ed25519KeyIdentity.generate().getPrincipal();

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

        const messageEvent = new MessageEvent('message', msg);
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

        del({key: `oisy_signer_${testOrigin}_${owner.toText()}`});
      });

      it('should not notify any other messages than icrc25_permissions', () => {
        const messageEvent = new MessageEvent('message', msg);
        window.dispatchEvent(messageEvent);

        expect(notifyReadySpy).not.toHaveBeenCalled();
        expect(notifySupportedStandardsSpy).not.toHaveBeenCalled();
        expect(notifyErrorSpy).not.toHaveBeenCalled();
      });
    });

    describe('Request permissions', () => {
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

        expect(postMessageMock).toHaveBeenNthCalledWith(
          1,
          {
            jsonrpc: JSON_RPC_VERSION_2,
            id: testId,
            error: {
              code: SignerErrorCode.PERMISSIONS_PROMPT_NOT_REGISTERED,
              message: 'The signer has not registered a prompt to respond to permission requests.'
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

        expect(postMessageMock).not.toHaveBeenCalled();

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

        expect(promptSpy).toHaveBeenNthCalledWith(1, {
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

        expect(promptSpy).toHaveBeenNthCalledWith(1, {
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

        expect(promptSpy).toHaveBeenNthCalledWith(1, {
          requestedScopes: requestPermissionsDataSortedScopes.map((scope) => ({
            scope: {...scope},
            state: IcrcPermissionStateSchema.enum.denied
          })),
          confirm: expect.any(Function),
          origin: testOrigin
        });

        promptSpy.mockClear();
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
        const requestMsg = {
          data: requestData,
          origin: testOrigin
        };

        it('should notify missing prompt', async () => {
          const messageEvent = new MessageEvent('message', requestMsg);
          window.dispatchEvent(messageEvent);

          await vi.waitFor(() => {
            expect(postMessageMock).toHaveBeenNthCalledWith(
              1,
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
            expect(postMessageMock).toHaveBeenNthCalledWith(
              1,
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
            prompt: ({confirm: confirmScopes, requestedScopes: _}: PermissionsPromptPayload) => {
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
            prompt: ({confirm: confirmScopes, requestedScopes: _}: PermissionsPromptPayload) => {
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
            expect(postMessageMock).toHaveBeenNthCalledWith(
              1,
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

      describe('Accounts', () => {
        const requestAccountsMsg = {
          data: requestAccountsData,
          origin: testOrigin
        };

        it('should notify account for icrc27_accounts if permissions were already granted', async () => {
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

          approve?.(mockAccounts);

          await vi.waitFor(() => {
            expect(postMessageMock).toHaveBeenNthCalledWith(
              1,
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
            expect(postMessageMock).toHaveBeenNthCalledWith(
              1,
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
            expect(postMessageMock).toHaveBeenNthCalledWith(
              1,
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
            expect(postMessageMock).toHaveBeenNthCalledWith(
              1,
              {
                jsonrpc: JSON_RPC_VERSION_2,
                id: testId,
                error: mockErrorNotify
              },
              testOrigin
            );
          });
        });
      });

      describe('Call canister', () => {
        let spyConsentMessage: MockInstance;

        beforeEach(() => {
          spyConsentMessage = vi.spyOn(Icrc21Canister.prototype, 'consentMessage');
        });

        describe('Consent message', () => {
          let notifyErrorSpy: MockInstance;

          beforeEach(() => {
            notifyErrorSpy = vi.spyOn(signerHandlers, 'notifyError');
          });

          describe('Call canister success', () => {
            beforeEach(() => {
              spyConsentMessage.mockResolvedValue({
                Ok: mockConsentInfo
              });
            });

            it('should prompt consent message for icrc49_call_canister if permissions were already granted', async () => {
              const promptSpy = vi.fn();

              signer.register({
                method: ICRC49_CALL_CANISTER,
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
                expect(promptSpy).toHaveBeenCalledTimes(1);
              });
            });

            it('should prompt consent message after prompt for icrc49_call_canister permissions', async () => {
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
                method: ICRC49_CALL_CANISTER,
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
                expect(promptSpy).toHaveBeenCalledTimes(1);
              });
            });

            it('should notify aborted error for icrc49_call_canister if user reject consent', async () => {
              let reject: Rejection | undefined;

              const prompt = ({reject: r}: ConsentMessagePromptPayload): void => {
                reject = r;
              };

              signer.register({
                method: ICRC49_CALL_CANISTER,
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
                method: ICRC49_CALL_CANISTER,
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

              expect(promptSpy).not.toHaveBeenCalledTimes(1);
            });
          });
        });

        describe('Execute call', () => {
          let spyCanisterCall: MockInstance;

          beforeEach(() => {
            vi.resetModules();
          });

          describe('No call without consent message first', () => {
            beforeEach(() => {
              spyCanisterCall = vi.spyOn(SignerApi.prototype, 'call').mockImplementation(vi.fn());

              spyConsentMessage.mockResolvedValue({
                Ok: mockConsentInfo
              });
            });

            it('should not call if consent message is pending even if permissions were already granted', async () => {
              const promptSpy = vi.fn();

              signer.register({
                method: ICRC49_CALL_CANISTER,
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
                expect(promptSpy).toHaveBeenCalledTimes(1);
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
                method: ICRC49_CALL_CANISTER,
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
                expect(promptSpy).toHaveBeenCalledTimes(1);
              });

              expect(spyCanisterCall).not.toHaveBeenCalled();
            });

            it('should not call if consent message is rejected', async () => {
              let reject: Rejection | undefined;

              const prompt = ({reject: r}: ConsentMessagePromptPayload): void => {
                reject = r;
              };

              signer.register({
                method: ICRC49_CALL_CANISTER,
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
            const approveAndCall = async (): Promise<void> => {
              let approve: ConsentMessageApproval | undefined;

              const prompt = ({approve: a}: ConsentMessagePromptPayload): void => {
                approve = a;
              };

              signer.register({
                method: ICRC49_CALL_CANISTER,
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

              const messageEvent = new MessageEvent('message', requestCallCanisterMsg);
              window.dispatchEvent(messageEvent);

              await vi.waitFor(() => {
                expect(approve).not.toBeUndefined();
              });

              approve?.();
            };

            describe('Call success', () => {
              let notifyCallCanisterSpy: MockInstance;

              beforeEach(async () => {
                spyCanisterCall = vi
                  .spyOn(SignerApi.prototype, 'call')
                  .mockResolvedValue(mockCallCanisterSuccess);

                notifyCallCanisterSpy = vi.spyOn(signerSuccessHandlers, 'notifyCallCanister');

                await approveAndCall();
              });

              it('should call canister and notify success', async () => {
                expect(spyCanisterCall).toHaveBeenNthCalledWith(1, {
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

              it('should call canister and notify error', async () => {
                expect(spyCanisterCall).toHaveBeenNthCalledWith(1, {
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
          });
        });
      });
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

    describe('Confirm permissions', () => {
      const scopes: IcrcScopesArray = [
        {
          scope: {
            method: ICRC27_ACCOUNTS
          },
          state: 'granted'
        },
        {
          scope: {
            method: ICRC49_CALL_CANISTER
          },
          state: 'denied'
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

        expect(notifyReadySpy).toHaveBeenCalledWith({
          id: testId,
          origin: testOrigin
        });

        signer.register({
          method: ICRC25_REQUEST_PERMISSIONS,
          prompt: (p: PermissionsPromptPayload) => (payload = p)
        });

        const messageEventPermissionsRequests = new MessageEvent('message', requestPermissionsMsg);
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
      }).not.toThrow();

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
      }).not.toThrow();

      expect(spy).toHaveBeenCalledWith(mockAccountsPrompt);
    });

    it('should validate a consent message prompt on register', () => {
      const mockConsentMessagePrompt = vi.fn();

      const spy = vi.spyOn(CallCanisterPromptSchema, 'parse');

      expect(() => {
        signer.register({
          method: ICRC49_CALL_CANISTER,
          prompt: mockConsentMessagePrompt
        });
      }).not.toThrow();

      expect(spy).toHaveBeenCalledWith(mockConsentMessagePrompt);
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
