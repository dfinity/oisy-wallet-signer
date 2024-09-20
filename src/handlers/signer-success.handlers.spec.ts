import type {Mock} from 'vitest';
import {ICRC27_ACCOUNTS} from '../constants/icrc.constants';
import {SIGNER_SUPPORTED_STANDARDS} from '../constants/signer.constants';
import {mockAccounts} from '../mocks/icrc-accounts.mocks';
import type {
  IcrcReadyResponse,
  IcrcScopesArray,
  IcrcScopesResponse,
  IcrcSupportedStandardsResponse
} from '../types/icrc-responses';
import {JSON_RPC_VERSION_2, type RpcId} from '../types/rpc';
import {
  notifyAccounts,
  notifyPermissionScopes,
  notifyReady,
  notifySupportedStandards
} from './signer-success.handlers';

describe('Signer-success.handlers', () => {
  let id: RpcId;
  const origin = 'https://hello.com';

  let originalOpener: typeof window.opener;

  let postMessageMock: Mock;

  beforeEach(() => {
    id = crypto.randomUUID();
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
});
