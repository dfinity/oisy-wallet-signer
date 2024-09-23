import {Ed25519KeyIdentity} from '@dfinity/identity';
import type {Mock, MockInstance} from 'vitest';
import {Icrc21Canister} from '../api/icrc21-canister.api';
import {SignerApi} from '../api/signer.api';
import {SignerErrorCode} from '../constants/signer.constants';
import * as signerSuccessHandlers from '../handlers/signer-success.handlers';
import * as signerHandlers from '../handlers/signer.handlers';
import {mockCallCanisterParams} from '../mocks/call-canister.mocks';
import {mockCanisterCallSuccess, mockConsentInfo} from '../mocks/consent-message.mocks';
import {mockPrincipalText} from '../mocks/icrc-accounts.mocks';
import {mockErrorNotify} from '../mocks/signer-error.mocks';
import type {IcrcCallCanisterRequestParams} from '../types/icrc-requests';
import {JSON_RPC_VERSION_2, type RpcId, type RpcResponseWithError} from '../types/rpc';
import type {Notify} from '../types/signer-handlers';
import type {SignerOptions} from '../types/signer-options';
import type {ConsentMessagePromptPayload} from '../types/signer-prompts';
import {base64ToUint8Array} from '../utils/base64.utils';
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
    let spyIcrc21CanisterConsentMessage: MockInstance;

    beforeEach(() => {
      spyIcrc21CanisterConsentMessage = vi.spyOn(Icrc21Canister.prototype, 'consentMessage');
    });

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
      const error = {GenericError: {description: 'Error', error_code: 1n}};

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
        expect(prompt).not.toHaveBeenCalled();
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
    });

    describe('Call consent message throws an error', () => {
      it('should return error when consentMessage throws an error', async () => {
        spyIcrc21CanisterConsentMessage.mockImplementation(() => {
          // eslint-disable-next-line @typescript-eslint/no-throw-literal
          throw 'Test';
        });

        const mockSpy = vi.fn();

        const result = await signerService.assertAndPromptConsentMessage({
          notify,
          params,
          prompt: mockSpy,
          options: signerOptions
        });

        expect(result).toEqual({result: 'error'});
        expect(mockSpy).not.toHaveBeenCalled();
      });

      it('should call notifyNetworkError with an unknown error message when consentMessage throws some error', async () => {
        spyIcrc21CanisterConsentMessage.mockImplementation(() => {
          // eslint-disable-next-line @typescript-eslint/no-throw-literal
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

      expect(prompt).not.toHaveBeenCalled();
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

      it('should call notifySenderNotAllowedError if sender does not match owner', async () => {
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

    beforeEach(() => {
      spySignerApiCall = vi.spyOn(SignerApi.prototype, 'call');
      notifyCallCanisterSpy = vi.spyOn(signerSuccessHandlers, 'notifyCallCanister');
      notifyErrorSpy = vi.spyOn(signerHandlers, 'notifyError');
    });

    it('should call the signer API with the correct parameters', async () => {
      spySignerApiCall.mockResolvedValue(mockCanisterCallSuccess);

      await signerService.callCanister({
        params,
        notify,
        options: signerOptions
      });

      expect(spySignerApiCall).toHaveBeenNthCalledWith(1, {
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
        options: signerOptions
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
        options: signerOptions
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
  });
});
