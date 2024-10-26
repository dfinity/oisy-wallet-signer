import type {Mock} from 'vitest';
import {ICRC25_PERMISSION_GRANTED, ICRC27_ACCOUNTS} from '../constants/icrc.constants';
import {SIGNER_SUPPORTED_STANDARDS} from '../constants/signer.constants';
import {mockCallCanisterSuccess} from '../mocks/call-canister.mocks';
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
  notifyCallCanister,
  notifyPermissionScopes,
  notifyReady,
  notifySupportedStandards
} from './signer-success.handlers';

describe('Signer-success.handlers', () => {
  let id: RpcId;
  const origin = 'https://hello.com';

  let sourceMock: Window;

  let postMessageMock: Mock;

  beforeEach(() => {
    id = crypto.randomUUID();

    postMessageMock = vi.fn();

    sourceMock = {
      postMessage: postMessageMock
    } as unknown as Window;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('notifyReady', () => {
    it('should post a message with the msg', () => {
      notifyReady({id, origin, source: sourceMock});

      const expectedMessage: IcrcReadyResponse = {
        jsonrpc: JSON_RPC_VERSION_2,
        id,
        result: 'ready'
      };

      expect(postMessageMock).toHaveBeenCalledWith(expectedMessage);
    });
  });

  describe('notifySupportedStandards', () => {
    it('should post a message with the msg', () => {
      notifySupportedStandards({id, origin, source: sourceMock});

      const expectedMessage: IcrcSupportedStandardsResponse = {
        jsonrpc: JSON_RPC_VERSION_2,
        id,
        result: {
          supportedStandards: SIGNER_SUPPORTED_STANDARDS
        }
      };

      expect(postMessageMock).toHaveBeenCalledWith(expectedMessage);
    });
  });

  describe('notifyPermissionScopes', () => {
    it('should post a message with the msg', () => {
      const scopes: IcrcScopesArray = [
        {
          scope: {
            method: ICRC27_ACCOUNTS
          },
          state: ICRC25_PERMISSION_GRANTED
        }
      ];

      notifyPermissionScopes({id, origin, scopes, source: sourceMock});

      const expectedMessage: IcrcScopesResponse = {
        jsonrpc: JSON_RPC_VERSION_2,
        id,
        result: {
          scopes
        }
      };

      expect(postMessageMock).toHaveBeenCalledWith(expectedMessage);
    });
  });

  describe('notifyAccounts', () => {
    it('should post a message with the accounts', () => {
      notifyAccounts({id, origin, accounts: mockAccounts, source: sourceMock});

      const expectedMessage = {
        jsonrpc: JSON_RPC_VERSION_2,
        id,
        result: {accounts: mockAccounts}
      };

      expect(postMessageMock).toHaveBeenCalledWith(expectedMessage);
    });
  });

  describe('notifyCallCanister', () => {
    it('should post a message with the call canister result', () => {
      notifyCallCanister({id, origin, result: mockCallCanisterSuccess, source: sourceMock});

      const expectedMessage = {
        jsonrpc: JSON_RPC_VERSION_2,
        id,
        result: mockCallCanisterSuccess
      };

      expect(postMessageMock).toHaveBeenCalledWith(expectedMessage);
    });
  });
});
