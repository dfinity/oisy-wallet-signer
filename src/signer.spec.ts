import {Ed25519KeyIdentity} from '@dfinity/identity';
import type {MockInstance} from 'vitest';
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
import * as signerHandlers from './handlers/signer.handlers';
import {saveSessionScopes} from './sessions/signer.sessions';
import {Signer} from './signer';
import type {IcrcAccountsRequest, IcrcRequestAnyPermissionsRequest} from './types/icrc-requests';
import type {IcrcScopesArray} from './types/icrc-responses';
import {IcrcWalletPermissionStateSchema} from './types/icrc-standards';
import {JSON_RPC_VERSION_2} from './types/rpc';
import type {SignerMessageEventData} from './types/signer';
import type {SignerOptions} from './types/signer-options';
import type {PermissionsConfirmation, PermissionsPromptPayload} from './types/signer-prompts';
import type {SessionPermissions} from './types/signer-sessions';
import {del, get} from './utils/storage.utils';

describe('Signer', () => {
  const signerOptions: SignerOptions = {
    owner: Ed25519KeyIdentity.generate().getPrincipal()
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

  it('should remove event listener for message on connect', () => {
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
          assertAndSetOrigin: (params: {origin: string; msgData: SignerMessageEventData}) => void;
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
    const testId = 'test-123';

    let originalOpener: typeof window.opener;

    let notifyReadySpy: MockInstance;
    let signer: Signer;

    let postMessageMock: MockInstance;

    beforeEach(() => {
      signer = Signer.init(signerOptions);
      notifyReadySpy = vi.spyOn(signerHandlers, 'notifyReady');
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
    const testId = 'test-123';
    const testOrigin = 'https://hello.com';

    const requestPermissionsData: IcrcRequestAnyPermissionsRequest = {
      id: testId,
      jsonrpc: JSON_RPC_VERSION_2,
      method: ICRC25_REQUEST_PERMISSIONS,
      params: {
        scopes: [{method: ICRC27_ACCOUNTS}]
      }
    };

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
        notifySupportedStandardsSpy = vi.spyOn(signerHandlers, 'notifySupportedStandards');
        notifyPermissionsSpy = vi.spyOn(signerHandlers, 'notifyPermissionScopes');
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
        notifyReadySpy = vi.spyOn(signerHandlers, 'notifyReady');
        notifyPermissionsSpy = vi.spyOn(signerHandlers, 'notifyPermissionScopes');
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
        notifyReadySpy = vi.spyOn(signerHandlers, 'notifyReady');
        notifySupportedStandardsSpy = vi.spyOn(signerHandlers, 'notifySupportedStandards');
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

      it('should trigger the registered prompt for icrc25_request_permissions', () => {
        const promptSpy = vi.fn();

        signer.register({
          method: ICRC25_REQUEST_PERMISSIONS,
          prompt: promptSpy
        });

        const messageEvent = new MessageEvent('message', requestPermissionsMsg);
        window.dispatchEvent(messageEvent);

        expect(promptSpy).toHaveBeenNthCalledWith(1, {
          requestedScopes: requestPermissionsData.params.scopes.map((scope) => ({
            scope: {...scope},
            state: IcrcWalletPermissionStateSchema.enum.denied
          })),
          confirmScopes: expect.any(Function)
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
                ...requestPermissionsData.params.scopes,
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
          requestedScopes: requestPermissionsData.params.scopes.map((scope) => ({
            scope: {...scope},
            state: IcrcWalletPermissionStateSchema.enum.denied
          })),
          confirmScopes: expect.any(Function)
        });

        promptSpy.mockClear();
      });
    });

    describe('Accounts', () => {
      const requestAccountsData: IcrcAccountsRequest = {
        id: testId,
        jsonrpc: JSON_RPC_VERSION_2,
        method: ICRC27_ACCOUNTS
      };

      const requestAccountsMsg = {
        data: requestAccountsData,
        origin: testOrigin
      };

      it('should notify missing prompt for icrc27_accounts', async () => {
        const messageEvent = new MessageEvent('message', requestAccountsMsg);
        window.dispatchEvent(messageEvent);

        await vi.waitFor(() => {
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
      });

      it('should prompt for permissions if icrc27_accounts currently matches ask_on_use - has not yet permissions set', async () => {
        const promptSpy = vi.fn();

        signer.register({
          method: ICRC25_REQUEST_PERMISSIONS,
          prompt: promptSpy
        });

        const messageEvent = new MessageEvent('message', requestAccountsMsg);
        window.dispatchEvent(messageEvent);

        await vi.waitFor(() => {
          expect(promptSpy).toHaveBeenCalledWith({
            requestedScopes: [
              {
                scope: {method: ICRC27_ACCOUNTS},
                state: IcrcWalletPermissionStateSchema.enum.denied
              }
            ],
            confirmScopes: expect.any(Function)
          });
        });

        promptSpy.mockClear();
      });

      it('should save granted permission after prompt for icrc27_accounts', async () => {
        let confirmScopes: PermissionsConfirmation | undefined;

        signer.register({
          method: ICRC25_REQUEST_PERMISSIONS,
          prompt: ({confirmScopes: confirm, requestedScopes: _}) => {
            confirmScopes = confirm;
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
            state: IcrcWalletPermissionStateSchema.enum.granted
          }
        ]);

        await vi.waitFor(() => {
          const storedScopes: SessionPermissions | undefined = get({
            key: `oisy_signer_${testOrigin}_${signerOptions.owner.toText()}`
          });

          expect(storedScopes).not.toBeUndefined();

          expect(storedScopes?.scopes).toEqual([
            {
              scope: {method: ICRC27_ACCOUNTS},
              state: IcrcWalletPermissionStateSchema.enum.granted,
              createdAt: expect.any(Number),
              updatedAt: expect.any(Number)
            }
          ]);
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
        notifyReadySpy = vi.spyOn(signerHandlers, 'notifyReady');

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
          prompt: (p) => (payload = p)
        });

        const messageEventPermissionsRequests = new MessageEvent('message', requestPermissionsMsg);
        window.dispatchEvent(messageEventPermissionsRequests);
      });

      it('should notify scopes for selected permissions', async () => {
        payload.confirmScopes(scopes);

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
        payload.confirmScopes(scopes);

        const expectedKey = `oisy_signer_${testOrigin}_${signerOptions.owner.toText()}`;
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
});
