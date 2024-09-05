import {Ed25519KeyIdentity} from '@dfinity/identity';
import type {Mock, MockInstance} from 'vitest';
import * as api from '../api/canister.api';
import {consentMessage} from '../api/canister.api';
import {SignerErrorCode} from '../constants/signer.constants';
import type {icrc21_consent_info} from '../declarations/icrc-21';
import {mockPrincipalText} from '../mocks/icrc-accounts.mocks';
import type {IcrcCallCanisterRequestParams} from '../types/icrc-requests';
import {JSON_RPC_VERSION_2, type RpcId, type RpcResponseWithError} from '../types/rpc';
import type {SignerOptions} from '../types/signer-options';
import type {ConsentMessagePromptPayload} from '../types/signer-prompts';
import {assertAndPromptConsentMessage, notifyErrorPermissionNotGranted} from './signer.services';

describe('Signer services', () => {
  let requestId: RpcId;
  let spy: MockInstance;

  const mockConsentInfo: icrc21_consent_info = {
    consent_message: {GenericDisplayMessage: 'Test Consent Message'},
    metadata: {
      language: 'en',
      utc_offset_minutes: [0]
    }
  };

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

  beforeEach(() => {
    requestId = crypto.randomUUID();
    spy = vi.spyOn(api, 'consentMessage');
  });

  afterEach(() => {
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
        requestId,
        params,
        prompt,
        ...signerOptions
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

    it('should return rejected when user rejects the consent message', async () => {
      spy.mockResolvedValue({
        Ok: mockConsentInfo
      });

      const prompt = ({reject}: ConsentMessagePromptPayload): void => {
        reject();
      };

      const result = await assertAndPromptConsentMessage({
        requestId,
        params,
        prompt,
        ...signerOptions
      });

      expect(result).toEqual({result: 'rejected'});
    });

    it('should return error when consentMessage returns error', async () => {
      spy.mockResolvedValue({
        Err: {GenericError: {description: 'Error', error_code: 1n}}
      });

      const prompt = vi.fn();

      const result = await assertAndPromptConsentMessage({
        requestId,
        params,
        prompt,
        ...signerOptions
      });

      expect(result).toEqual({result: 'error'});
      expect(prompt).not.toHaveBeenCalled();
    });

    it.skip('should throw MissingPromptError if prompt is undefined', async () => {
      // TODO: missing prompt error test
      // try {
      //   await assertAndPromptConsentMessage({
      //     requestId,
      //     params,
      //     prompt: undefined,
      //     ...signerOptions
      //   });
      // } catch (error) {
      //   expect(error).toBeInstanceOf(MissingPromptError);
      // }
    });

    it('should return error if consentMessage throws', async () => {
      spy.mockRejectedValue(new Error('Test Error'));

      const prompt = vi.fn();

      const result = await assertAndPromptConsentMessage({
        requestId,
        params,
        prompt,
        ...signerOptions
      });

      expect(result).toEqual({result: 'error'});

      expect(prompt).not.toHaveBeenCalled();
    });
  });

  describe('notifyErrorPermissionNotGranted', () => {
    const origin = 'https://hello.com';

    let originalOpener: typeof window.opener;

    let postMessageMock: Mock;

    beforeEach(() => {
      originalOpener = window.opener;

      postMessageMock = vi.fn();

      vi.stubGlobal('opener', {postMessage: postMessageMock});
    });

    afterEach(() => {
      window.opener = originalOpener;

      vi.restoreAllMocks();
    });

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
