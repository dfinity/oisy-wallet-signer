import {Ed25519KeyIdentity} from '@dfinity/identity';
import type {Mock, MockInstance} from 'vitest';
import * as api from '../api/canister.api';
import {consentMessage} from '../api/canister.api';
import {SignerErrorCode} from '../constants/signer.constants';
import {mockConsentInfo} from '../mocks/consent-message.mocks';
import {mockPrincipalText} from '../mocks/icrc-accounts.mocks';
import type {IcrcCallCanisterRequestParams} from '../types/icrc-requests';
import {JSON_RPC_VERSION_2, type RpcId, type RpcResponseWithError} from '../types/rpc';
import type {Notify} from '../types/signer-handlers';
import type {SignerOptions} from '../types/signer-options';
import type {ConsentMessagePromptPayload} from '../types/signer-prompts';
import {mapIcrc21ErrorToString} from '../utils/icrc-21.utils';
import {
  assertAndPromptConsentMessage,
  notifyErrorPermissionNotGranted,
  notifyErrorRequestNotSupported
} from './signer.services';

describe('Signer services', () => {
  let requestId: RpcId;
  let spy: MockInstance;

  const testOrigin = 'https://hello.com';
  let notify: Notify;

  const params: IcrcCallCanisterRequestParams = {
    canisterId: mockPrincipalText,
    sender: mockPrincipalText,
    method: 'some_method',
    arg: new Uint8Array([1, 2, 3, 4])
  };

  const signerOptions: SignerOptions = {
    owner: Ed25519KeyIdentity.generate(),
    host: 'http://localhost:5987'
  };

  const origin = 'https://hello.com';

  let originalOpener: typeof window.opener;

  let postMessageMock: Mock;

  beforeEach(() => {
    originalOpener = window.opener;

    postMessageMock = vi.fn();

    vi.stubGlobal('opener', {postMessage: postMessageMock});

    requestId = crypto.randomUUID();
    spy = vi.spyOn(api, 'consentMessage');

    notify = {
      id: requestId,
      origin: testOrigin
    };
  });

  afterEach(() => {
    window.opener = originalOpener;

    vi.clearAllMocks();
  });

  describe('assertAndPromptConsentMessage', () => {
    it('should return approved when user approves the consent message', async () => {
      spy.mockResolvedValue({
        Ok: mockConsentInfo
      });

      const prompt = ({approve}: ConsentMessagePromptPayload): void => {
        approve();
      };

      const result = await assertAndPromptConsentMessage({
        notify,
        params,
        prompt,
        options: signerOptions
      });

      expect(result).toEqual({result: 'approved'});

      expect(consentMessage).toHaveBeenCalledWith({
        ...signerOptions,
        canisterId: params.canisterId,
        request: {
          method: params.method,
          arg: params.arg,
          user_preferences: {
            metadata: {language: 'en', utc_offset_minutes: []},
            device_spec: []
          }
        }
      });
    });

    describe('User reject consent', () => {
      beforeEach(() => {
        spy.mockResolvedValue({
          Ok: mockConsentInfo
        });
      });

      it('should return rejected when user rejects the consent message', async () => {
        const prompt = ({reject}: ConsentMessagePromptPayload): void => {
          reject();
        };

        const result = await assertAndPromptConsentMessage({
          notify,
          params,
          prompt,
          options: signerOptions
        });

        expect(result).toEqual({result: 'rejected'});
      });

      it('should call notifyErrorActionAborted when user rejects consent message', async () => {
        const prompt = ({reject}: ConsentMessagePromptPayload): void => {
          reject();
        };

        await assertAndPromptConsentMessage({
          notify,
          params,
          prompt,
          options: signerOptions
        });

        const errorNotify = {
          code: SignerErrorCode.ACTION_ABORTED,
          message: 'The signer has canceled the action requested by the relying party.'
        };

        const expectedMessage: RpcResponseWithError = {
          jsonrpc: JSON_RPC_VERSION_2,
          id: requestId,
          error: errorNotify
        };

        expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, origin);
      });
    });

    describe('Call consent message responds with an error', () => {
      const error = {GenericError: {description: 'Error', error_code: 1n}};

      beforeEach(() => {
        spy.mockResolvedValue({
          Err: error
        });
      });

      it('should return error when consentMessage returns error', async () => {
        const prompt = vi.fn();

        const result = await assertAndPromptConsentMessage({
          notify,
          params,
          prompt,
          options: signerOptions
        });

        expect(result).toEqual({result: 'error'});
        expect(prompt).not.toHaveBeenCalled();
      });

      it('should call notifyErrorRequestNotSupported when consentMessage returns error', async () => {
        await assertAndPromptConsentMessage({
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

        expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, origin);
      });
    });

    describe('Call consent message throws an error', () => {
      it('should return error when consentMessage throws an error', async () => {
        spy.mockImplementation(() => {
          // eslint-disable-next-line @typescript-eslint/no-throw-literal
          throw 'Test';
        });

        const mockSpy = vi.fn();

        const result = await assertAndPromptConsentMessage({
          notify,
          params,
          prompt: mockSpy,
          options: signerOptions
        });

        expect(result).toEqual({result: 'error'});
        expect(mockSpy).not.toHaveBeenCalled();
      });

      it('should call notifyNetworkError with an unknown error message when consentMessage throws some error', async () => {
        spy.mockImplementation(() => {
          // eslint-disable-next-line @typescript-eslint/no-throw-literal
          throw 'Test';
        });

        await assertAndPromptConsentMessage({
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

        expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, origin);
      });

      it('should call notifyNetworkError with an the error message when consentMessage throws an error', async () => {
        const errorMessage = 'This is a test';

        spy.mockImplementation(() => {
          throw new Error(errorMessage);
        });

        await assertAndPromptConsentMessage({
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

        expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, origin);
      });
    });

    it('should notify MissingPromptError if prompt is undefined', async () => {
      await assertAndPromptConsentMessage({
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

      expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, origin);
    });

    it('should return error if consentMessage throws', async () => {
      spy.mockRejectedValue(new Error('Test Error'));

      const prompt = vi.fn();

      const result = await assertAndPromptConsentMessage({
        notify,
        params,
        prompt,
        options: signerOptions
      });

      expect(result).toEqual({result: 'error'});

      expect(prompt).not.toHaveBeenCalled();
    });
  });

  describe('notifyErrorPermissionNotGranted', () => {
    describe('notifyErrorNotSupported', () => {
      it('should post an error message with default message when none is provided', () => {
        const error = {
          code: SignerErrorCode.REQUEST_NOT_SUPPORTED,
          message: 'The request sent by the relying party is not supported by the signer.'
        };

        notifyErrorRequestNotSupported({id: requestId, origin});

        const expectedMessage: RpcResponseWithError = {
          jsonrpc: JSON_RPC_VERSION_2,
          id: requestId,
          error
        };

        expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, origin);
      });

      it('should post an error message with custom message when provided', () => {
        const message = 'This is a test';

        const error = {
          code: SignerErrorCode.REQUEST_NOT_SUPPORTED,
          message
        };

        notifyErrorRequestNotSupported({id: requestId, origin, message});

        const expectedMessage: RpcResponseWithError = {
          jsonrpc: JSON_RPC_VERSION_2,
          id: requestId,
          error
        };

        expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, origin);
      });
    });

    describe('notifyErrorPermissionNotGranted', () => {
      it('should post an error message indicating permission not granted', () => {
        const error = {
          code: SignerErrorCode.PERMISSION_NOT_GRANTED,
          message:
            'The signer has not granted the necessary permissions to process the request from the relying party.'
        };

        notifyErrorPermissionNotGranted({id: requestId, origin});

        const expectedMessage: RpcResponseWithError = {
          jsonrpc: JSON_RPC_VERSION_2,
          id: requestId,
          error
        };

        expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, origin);
      });
    });
  });
});
