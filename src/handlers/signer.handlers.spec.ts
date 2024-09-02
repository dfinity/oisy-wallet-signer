import type {Mock} from 'vitest';
import {mockAccounts} from '../constants/icrc-accounts.mocks';
import {ICRC27_ACCOUNTS} from '../constants/icrc.constants';
import {SIGNER_SUPPORTED_STANDARDS, SignerErrorCode} from '../constants/signer.constants';
import type {
  IcrcReadyResponse,
  IcrcScopesArray,
  IcrcScopesResponse,
  IcrcSupportedStandardsResponse
} from '../types/icrc-responses';
import {JSON_RPC_VERSION_2, type RpcId, type RpcResponseWithError} from '../types/rpc';
import {
  notifyAccounts,
  notifyError,
  notifyErrorPermissionNotGranted,
  notifyPermissionScopes,
  notifyReady,
  notifySupportedStandards
} from './signer.handlers';

describe('Signer handlers', () => {
  const id: RpcId = 'test-123';
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

  describe('notifyReady', () => {
    it('should post a message with the msg', () => {
      notifyReady({id, origin});

      const expectedMessage: IcrcReadyResponse = {
        jsonrpc: JSON_RPC_VERSION_2,
        id,
        result: 'ready'
      };

      expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, origin);
    });
  });

  describe('notifyError', () => {
    it('should post the error', () => {
      const error = {
        code: SignerErrorCode.ORIGIN_ERROR,
        message: 'This is an error test.'
      };

      notifyError({id, origin, error});

      const expectedMessage: RpcResponseWithError = {
        jsonrpc: JSON_RPC_VERSION_2,
        id,
        error
      };

      expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, origin);
    });
  });

  describe('notifySupportedStandards', () => {
    it('should post a message with the msg', () => {
      notifySupportedStandards({id, origin});

      const expectedMessage: IcrcSupportedStandardsResponse = {
        jsonrpc: JSON_RPC_VERSION_2,
        id,
        result: {
          supportedStandards: SIGNER_SUPPORTED_STANDARDS
        }
      };

      expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, origin);
    });
  });

  describe('notifyPermissionScopes', () => {
    it('should post a message with the msg', () => {
      const scopes: IcrcScopesArray = [
        {
          scope: {
            method: ICRC27_ACCOUNTS
          },
          state: 'granted'
        }
      ];

      notifyPermissionScopes({id, origin, scopes});

      const expectedMessage: IcrcScopesResponse = {
        jsonrpc: JSON_RPC_VERSION_2,
        id,
        result: {
          scopes
        }
      };

      expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, origin);
    });
  });

  describe('notifyAccounts', () => {
    it('should post a message with the accounts', () => {
      notifyAccounts({id, origin, accounts: mockAccounts});

      const expectedMessage = {
        jsonrpc: JSON_RPC_VERSION_2,
        id,
        result: {accounts: mockAccounts}
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

      notifyErrorPermissionNotGranted({id, origin});

      const expectedMessage: RpcResponseWithError = {
        jsonrpc: JSON_RPC_VERSION_2,
        id,
        error
      };

      expect(postMessageMock).toHaveBeenCalledWith(expectedMessage, origin);
    });
  });
});
