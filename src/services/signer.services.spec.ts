import {uint8ToBuf} from '@dfinity/agent';
import {Ed25519KeyIdentity} from '@dfinity/identity';
import {mapTokenMetadata, type IcrcTokenMetadata} from '@dfinity/ledger-icrc';
import {assertNonNullish, base64ToUint8Array} from '@dfinity/utils';
import type {Mock, MockInstance} from 'vitest';
import {Icrc21Canister} from '../api/icrc21-canister.api';
import {SignerApi} from '../api/signer.api';
import {SIGNER_BUILDERS} from '../constants/signer.builders.constants';
import {SignerErrorCode} from '../constants/signer.constants';
import * as signerSuccessHandlers from '../handlers/signer-success.handlers';
import * as signerHandlers from '../handlers/signer.handlers';
import {mockCallCanisterParams} from '../mocks/call-canister.mocks';
import {mockCanisterCallSuccess, mockConsentInfo} from '../mocks/consent-message.mocks';
import {mockPrincipalText} from '../mocks/icrc-accounts.mocks';
import {mockIcrcApproveArg} from '../mocks/icrc-approve.mocks';
import {mockIcrcLocalCallParams} from '../mocks/icrc-call-utils.mocks';
import {mockIcrcLedgerMetadata} from '../mocks/icrc-ledger.mocks';
import {mockIcrcTransferFromArg} from '../mocks/icrc-transfer-from.mocks';
import {mockErrorNotify} from '../mocks/signer-error.mocks';
import type {IcrcCallCanisterRequestParams} from '../types/icrc-requests';
import {JSON_RPC_VERSION_2, type RpcId, type RpcResponseWithError} from '../types/rpc';
import type {Notify} from '../types/signer-handlers';
import type {SignerOptions} from '../types/signer-options';
import type {ConsentMessagePromptPayload} from '../types/signer-prompts';
import {mapIcrc21ErrorToString} from '../utils/icrc-21.utils';
import {SignerService} from './signer.service';

describe('Signer services', () => {
  let requestId: RpcId;
  let signerService: SignerService;

  const testOrigin = 'https://hello.com';
  let notify: Notify;

  const owner = Ed25519KeyIdentity.generate();

  const params: IcrcCallCanisterRequestParams = {
    ...mockCallCanisterParams,
    sender: owner.getPrincipal().toText()
  };

  const signerOptions: SignerOptions = {
    owner,
    host: 'http://localhost:4943'
  };

  let originalOpener: typeof window.opener;

  let postMessageMock: Mock;

  beforeEach(() => {
    originalOpener = window.opener;

    postMessageMock = vi.fn();

    vi.stubGlobal('opener', {postMessage: postMessageMock});

    requestId = crypto.randomUUID();

    notify = {
      id: requestId,
      origin: testOrigin
    };

    signerService = new SignerService();
  });

  afterEach(() => {
    window.opener = originalOpener;

    vi.clearAllMocks();
  });

  describe('Consent message', () => {
    const error = {GenericError: {description: 'Error', error_code: 1n}};

    let spyIcrc21CanisterConsentMessage: MockInstance;

    beforeEach(() => {
      spyIcrc21CanisterConsentMessage = vi.spyOn(Icrc21Canister.prototype, 'consentMessage');
    });

    it('should trigger prompt "loading" before the consent message is processed', async () => {
      const prompt = vi.fn();

      spyIcrc21CanisterConsentMessage.mockResolvedValue({
        Err: error
      });

      await signerService.assertAndPromptConsentMessage({
        notify,
        params,
        prompt,
        options: signerOptions
      });

      expect(prompt).toHaveBeenCalledWith({
        origin: testOrigin,
        status: 'loading'
      });
    });

    describe('User reject consent', () => {
      beforeEach(() => {
        spyIcrc21CanisterConsentMessage.mockResolvedValue({
          Ok: mockConsentInfo
        });
      });

      it('should return rejected when user rejects the consent message', async () => {
        const prompt = ({status, ...rest}: ConsentMessagePromptPayload): void => {
          if (status === 'result' && 'reject' in rest) {
            rest.reject();
          }
        };

        const result = await signerService.assertAndPromptConsentMessage({
          notify,
          params,
          prompt,
          options: signerOptions
        });

        expect(result).toEqual({result: 'rejected'});
      });

      it('should call notifyErrorActionAborted when user rejects consent message', async () => {
        const prompt = ({status, ...rest}: ConsentMessagePromptPayload): void => {
          if (status === 'result' && 'reject' in rest) {
            rest.reject();
          }
        };

        await signerService.assertAndPromptConsentMessage({
          notify,
          params,
          prompt,
          options: signerOptions
        });

        const expectedMessage: RpcResponseWithError = {
          jsonrpc: JSON_RPC_VERSION_2,
          id: requestId,
          error: mockErrorNotify
        };

        expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, testOrigin);
      });
    });

    describe('Call consent message responds with an error', () => {
      beforeEach(() => {
        spyIcrc21CanisterConsentMessage.mockResolvedValue({
          Err: error
        });
      });

      it('should return error when consentMessage returns error', async () => {
        const prompt = vi.fn();

        const result = await signerService.assertAndPromptConsentMessage({
          notify,
          params,
          prompt,
          options: signerOptions
        });

        expect(result).toEqual({result: 'error'});
      });

      it('should call notifyErrorRequestNotSupported when consentMessage returns error', async () => {
        await signerService.assertAndPromptConsentMessage({
          notify,
          params,
          prompt: vi.fn(),
          options: signerOptions
        });

        const errorNotify = {
          code: SignerErrorCode.REQUEST_NOT_SUPPORTED,
          message: mapIcrc21ErrorToString(error)
        };

        const expectedMessage: RpcResponseWithError = {
          jsonrpc: JSON_RPC_VERSION_2,
          id: requestId,
          error: errorNotify
        };

        expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, testOrigin);
      });

      it('should trigger prompt "error" with the error', async () => {
        const prompt = vi.fn();

        await signerService.assertAndPromptConsentMessage({
          notify,
          params,
          prompt,
          options: signerOptions
        });

        expect(prompt).toHaveBeenCalledWith({
          origin: testOrigin,
          status: 'error',
          details: error
        });
      });
    });

    describe('Call consent message throws an error', () => {
      it('should return error when consentMessage throws an error', async () => {
        spyIcrc21CanisterConsentMessage.mockImplementation(() => {
          throw 'Test';
        });

        const prompt = vi.fn();

        const result = await signerService.assertAndPromptConsentMessage({
          notify,
          params,
          prompt,
          options: signerOptions
        });

        expect(result).toEqual({result: 'error'});
      });

      it('should call notifyNetworkError with an unknown error message when consentMessage throws some error', async () => {
        spyIcrc21CanisterConsentMessage.mockImplementation(() => {
          throw 'Test';
        });

        await signerService.assertAndPromptConsentMessage({
          notify,
          params,
          prompt: vi.fn(),
          options: signerOptions
        });

        const errorNotify = {
          code: SignerErrorCode.NETWORK_ERROR,
          message: 'An unknown error occurred'
        };

        const expectedMessage: RpcResponseWithError = {
          jsonrpc: JSON_RPC_VERSION_2,
          id: requestId,
          error: errorNotify
        };

        expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, testOrigin);
      });

      it('should call notifyNetworkError with an the error message when consentMessage throws an error', async () => {
        const errorMessage = 'This is a test';

        spyIcrc21CanisterConsentMessage.mockImplementation(() => {
          throw new Error(errorMessage);
        });

        await signerService.assertAndPromptConsentMessage({
          notify,
          params,
          prompt: vi.fn(),
          options: signerOptions
        });

        const errorNotify = {
          code: SignerErrorCode.NETWORK_ERROR,
          message: errorMessage
        };

        const expectedMessage: RpcResponseWithError = {
          jsonrpc: JSON_RPC_VERSION_2,
          id: requestId,
          error: errorNotify
        };

        expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, testOrigin);
      });
    });

    it('should notify MissingPromptError if prompt is undefined', async () => {
      await signerService.assertAndPromptConsentMessage({
        notify,
        params,
        prompt: undefined,
        options: signerOptions
      });

      const errorNotify = {
        code: SignerErrorCode.PERMISSIONS_PROMPT_NOT_REGISTERED,
        message: 'The signer has not registered a prompt to respond to permission requests.'
      };

      const expectedMessage: RpcResponseWithError = {
        jsonrpc: JSON_RPC_VERSION_2,
        id: requestId,
        error: errorNotify
      };

      expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, testOrigin);
    });

    describe('Without consent message fallback', () => {
      it('should return approved when user approves the consent message', async () => {
        spyIcrc21CanisterConsentMessage.mockResolvedValue({
          Ok: mockConsentInfo
        });

        const prompt = ({status, ...rest}: ConsentMessagePromptPayload): void => {
          if (status === 'result' && 'approve' in rest) {
            rest.approve();
          }
        };

        const result = await signerService.assertAndPromptConsentMessage({
          notify,
          params,
          prompt,
          options: signerOptions
        });

        expect(result).toEqual({result: 'approved'});

        expect(spyIcrc21CanisterConsentMessage).toHaveBeenCalledWith({
          ...signerOptions,
          canisterId: params.canisterId,
          request: {
            method: params.method,
            arg: base64ToUint8Array(params.arg),
            user_preferences: {
              metadata: {language: 'en', utc_offset_minutes: []},
              device_spec: []
            }
          }
        });
      });

      it('should provide a valid consent message with Ok', () =>
        // eslint-disable-next-line no-async-promise-executor
        new Promise<void>(async (done) => {
          spyIcrc21CanisterConsentMessage.mockResolvedValue({
            Ok: mockConsentInfo
          });

          const prompt = ({status, ...rest}: ConsentMessagePromptPayload): void => {
            if (status === 'result' && 'consentInfo' in rest && 'Ok' in rest.consentInfo) {
              expect(rest.consentInfo.Ok).toEqual(mockConsentInfo);

              done();
            }
          };

          await signerService.assertAndPromptConsentMessage({
            notify,
            params,
            prompt,
            options: signerOptions
          });
        }));

      it('should return error if consentMessage throws', async () => {
        spyIcrc21CanisterConsentMessage.mockRejectedValue(new Error('Test Error'));

        const prompt = vi.fn();

        const result = await signerService.assertAndPromptConsentMessage({
          notify,
          params,
          prompt,
          options: signerOptions
        });

        expect(result).toEqual({result: 'error'});
      });

      it('should trigger prompt "error" if consentMessage throws', async () => {
        const error = new Error('Test Error');

        spyIcrc21CanisterConsentMessage.mockRejectedValue(error);

        const prompt = vi.fn();

        await signerService.assertAndPromptConsentMessage({
          notify,
          params,
          prompt,
          options: signerOptions
        });

        expect(prompt).toHaveBeenCalledWith({
          origin: testOrigin,
          status: 'error',
          details: error
        });
      });
    });

    describe('With consent message fallback', () => {
      let spySignerApiLedgerMedatada: MockInstance;

      beforeEach(() => {
        spySignerApiLedgerMedatada = vi.spyOn(SignerApi.prototype, 'ledgerMetadata');
      });

      describe.each([
        {method: 'icrc1_transfer', arg: mockIcrcLocalCallParams.arg},
        {method: 'icrc2_approve', arg: mockIcrcApproveArg},
        {method: 'icrc2_transfer_from', arg: mockIcrcTransferFromArg}
      ])('With fallback for $method', ({method, arg}) => {
        it('should return approved when user approves the consent message that was built', async () => {
          spyIcrc21CanisterConsentMessage.mockRejectedValue(new Error('Test Error'));
          spySignerApiLedgerMedatada.mockResolvedValue(mockIcrcLedgerMetadata);

          const prompt = ({status, ...rest}: ConsentMessagePromptPayload): void => {
            if (status === 'result' && 'approve' in rest) {
              rest.approve();
            }
          };

          const result = await signerService.assertAndPromptConsentMessage({
            notify,
            params: {
              ...params,
              method,
              arg
            },
            prompt,
            options: signerOptions
          });

          expect(result).toEqual({result: 'approved'});

          expect(spyIcrc21CanisterConsentMessage).toHaveBeenCalledWith({
            ...signerOptions,
            canisterId: params.canisterId,
            request: {
              method,
              arg: base64ToUint8Array(arg),
              user_preferences: {
                metadata: {language: 'en', utc_offset_minutes: []},
                device_spec: []
              }
            }
          });
        });

        it('should provide a valid consent message with Warn', () =>
          // eslint-disable-next-line no-async-promise-executor
          new Promise<void>(async (done) => {
            spyIcrc21CanisterConsentMessage.mockRejectedValue(new Error('Test Error'));
            spySignerApiLedgerMedatada.mockResolvedValue(mockIcrcLedgerMetadata);

            const prompt = async ({
              status,
              ...rest
            }: ConsentMessagePromptPayload): Promise<void> => {
              if (status === 'result' && 'consentInfo' in rest && 'Warn' in rest.consentInfo) {
                expect(rest.consentInfo.Warn.method).toEqual(method);
                expect(rest.consentInfo.Warn.arg).toEqual(arg);
                expect(rest.consentInfo.Warn.canisterId).toEqual(params.canisterId);

                const fn = SIGNER_BUILDERS[method];

                assertNonNullish(fn);

                const result = await fn({
                  arg: uint8ToBuf(base64ToUint8Array(arg)),
                  token: mapTokenMetadata(mockIcrcLedgerMetadata) as IcrcTokenMetadata,
                  owner: owner.getPrincipal()
                });

                if ('Err' in result) {
                  expect(true).toBeFalsy();

                  return;
                }

                expect(rest.consentInfo.Warn.consentInfo).toEqual(result.Ok);

                done();
              }
            };

            await signerService.assertAndPromptConsentMessage({
              notify,
              params: {
                ...params,
                method,
                arg
              },
              prompt,
              options: signerOptions
            });
          }));

        it('should return error if consentMessage throws and ledger metadata throws', async () => {
          const error = new Error('Test Error');
          const ledgerError = new Error('Test Error');

          spyIcrc21CanisterConsentMessage.mockRejectedValue(error);
          spySignerApiLedgerMedatada.mockRejectedValue(ledgerError);

          const prompt = vi.fn();

          const result = await signerService.assertAndPromptConsentMessage({
            notify,
            params: {
              ...params,
              method
            },
            prompt,
            options: signerOptions
          });

          expect(result).toEqual({result: 'error'});
        });

        it('should return error if consentMessage throws and build throws', async () => {
          const error = new Error('Test Error');

          spyIcrc21CanisterConsentMessage.mockRejectedValue(error);
          spySignerApiLedgerMedatada.mockResolvedValue(mockIcrcLedgerMetadata);
          // Signer builder error with arg lead to "Wrong magic number". Similar test in signer.builder.spec.ts

          const prompt = vi.fn();

          const result = await signerService.assertAndPromptConsentMessage({
            notify,
            params: {
              ...params,
              method
            },
            prompt,
            options: signerOptions
          });

          expect(result).toEqual({result: 'error'});
        });

        it('should trigger prompt "error" if consentMessage throws and ledger metadata throws', async () => {
          const error = new Error('Test Error');
          const ledgerError = new Error('Test Error');

          spyIcrc21CanisterConsentMessage.mockRejectedValue(error);
          spySignerApiLedgerMedatada.mockRejectedValue(ledgerError);

          const prompt = vi.fn();

          await signerService.assertAndPromptConsentMessage({
            notify,
            params: {
              ...params,
              method
            },
            prompt,
            options: signerOptions
          });

          expect(prompt).toHaveBeenCalledWith({
            origin: testOrigin,
            status: 'error',
            details: error
          });
        });

        it('should trigger prompt "error" if consentMessage throws and builder throws', async () => {
          const error = new Error('Test Error');

          spyIcrc21CanisterConsentMessage.mockRejectedValue(error);
          spySignerApiLedgerMedatada.mockResolvedValue(mockIcrcLedgerMetadata);
          // Signer builder error with arg lead to "Wrong magic number". Similar test in signer.builder.spec.ts

          const prompt = vi.fn();

          await signerService.assertAndPromptConsentMessage({
            notify,
            params: {
              ...params,
              method
            },
            prompt,
            options: signerOptions
          });

          expect(prompt).toHaveBeenCalledWith({
            origin: testOrigin,
            status: 'error',
            details: error
          });
        });
      });

      it('should return error if consentMessage throws and no matching fallback', async () => {
        spyIcrc21CanisterConsentMessage.mockRejectedValue(new Error('Test Error'));

        const prompt = vi.fn();

        const result = await signerService.assertAndPromptConsentMessage({
          notify,
          params,
          prompt,
          options: signerOptions
        });

        expect(result).toEqual({result: 'error'});
      });

      it('should trigger prompt "error" if consentMessage throws and no matching fallback', async () => {
        const error = new Error('Test Error');

        spyIcrc21CanisterConsentMessage.mockRejectedValue(error);

        const prompt = vi.fn();

        await signerService.assertAndPromptConsentMessage({
          notify,
          params,
          prompt,
          options: signerOptions
        });

        expect(prompt).toHaveBeenCalledWith({
          origin: testOrigin,
          status: 'error',
          details: error
        });
      });
    });

    describe('Assert sender', () => {
      const prompt = vi.fn();

      const invalidParams = {
        ...params,
        sender: mockPrincipalText
      };

      it('should return error if sender does not match owner', async () => {
        const result = await signerService.assertAndPromptConsentMessage({
          notify,
          params: invalidParams,
          prompt,
          options: signerOptions
        });

        expect(result).toEqual({result: 'error'});
        expect(spyIcrc21CanisterConsentMessage).not.toHaveBeenCalled();
        expect(prompt).not.toHaveBeenCalled();
      });

      it('should call notifyErrorSenderNotAllowed if sender does not match owner', async () => {
        await signerService.assertAndPromptConsentMessage({
          notify,
          params: invalidParams,
          prompt,
          options: signerOptions
        });

        const errorNotify = {
          code: SignerErrorCode.SENDER_NOT_ALLOWED,
          message: 'The sender must match the owner of the signer.'
        };

        const expectedMessage: RpcResponseWithError = {
          jsonrpc: JSON_RPC_VERSION_2,
          id: requestId,
          error: errorNotify
        };

        expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, testOrigin);
      });
    });
  });

  describe('Call canister', () => {
    let spySignerApiCall: MockInstance;
    let notifyCallCanisterSpy: MockInstance;
    let notifyErrorSpy: MockInstance;

    let prompt: Mock;

    beforeEach(() => {
      spySignerApiCall = vi.spyOn(SignerApi.prototype, 'call');
      notifyCallCanisterSpy = vi.spyOn(signerSuccessHandlers, 'notifyCallCanister');
      notifyErrorSpy = vi.spyOn(signerHandlers, 'notifyError');

      prompt = vi.fn();
    });

    it('should call the signer API with the correct parameters', async () => {
      spySignerApiCall.mockResolvedValue(mockCanisterCallSuccess);

      await signerService.callCanister({
        params,
        notify,
        options: signerOptions,
        prompt
      });

      expect(spySignerApiCall).toHaveBeenCalledExactlyOnceWith({
        ...signerOptions,
        params
      });

      expect(notifyCallCanisterSpy).toHaveBeenCalledWith({
        id: requestId,
        origin: testOrigin,
        result: mockCanisterCallSuccess
      });
    });

    it('should throw an error if API call fails', async () => {
      const errorMsg = 'Test Error';

      spySignerApiCall.mockRejectedValue(new Error(errorMsg));

      await signerService.callCanister({
        params,
        notify,
        options: signerOptions,
        prompt
      });

      expect(notifyErrorSpy).toHaveBeenCalledWith({
        id: requestId,
        origin: testOrigin,
        error: {
          code: SignerErrorCode.NETWORK_ERROR,
          message: errorMsg
        }
      });
    });

    it('should throw an unknown error if API call fails', async () => {
      spySignerApiCall.mockRejectedValue(new Error());

      await signerService.callCanister({
        params,
        notify,
        options: signerOptions,
        prompt
      });

      expect(notifyErrorSpy).toHaveBeenCalledWith({
        id: requestId,
        origin: testOrigin,
        error: {
          code: SignerErrorCode.NETWORK_ERROR,
          message: 'An unknown error occurred'
        }
      });
    });

    it('should trigger prompt "executing" before the call canister if a prompt is provided', async () => {
      spySignerApiCall.mockResolvedValue(mockCanisterCallSuccess);

      await signerService.callCanister({
        params,
        notify,
        options: signerOptions,
        prompt
      });

      expect(prompt).toHaveBeenCalledWith({
        origin: testOrigin,
        status: 'executing'
      });
    });

    it('should trigger prompt "result" with the call canister results if a prompt is provided', async () => {
      spySignerApiCall.mockResolvedValue(mockCanisterCallSuccess);

      await signerService.callCanister({
        params,
        notify,
        options: signerOptions,
        prompt
      });

      expect(prompt).toHaveBeenCalledWith({
        origin: testOrigin,
        status: 'result',
        ...mockCanisterCallSuccess
      });
    });

    it('should trigger prompt "error" if the call canister throws', async () => {
      const error = new Error('Test Error');

      spySignerApiCall.mockRejectedValue(error);

      await signerService.callCanister({
        params,
        notify,
        options: signerOptions,
        prompt
      });

      expect(prompt).toHaveBeenCalledWith({
        origin: testOrigin,
        status: 'error',
        details: error
      });
    });
  });
});
