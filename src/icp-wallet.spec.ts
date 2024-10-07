import {Ed25519KeyIdentity} from '@dfinity/identity';
import type {Icrc1TransferRequest} from '@dfinity/ledger-icp';
import {toNullable} from '@dfinity/utils';
import {IcpWallet} from './icp-wallet';
import {
  mockLocalBlockHeight,
  mockLocalCallParams,
  mockLocalCallResult,
  mockLocalCallTime,
  mockLocalRelyingPartyPrincipal
} from './mocks/call-utils.mocks';
import {mockLocalIcRootKey} from './mocks/custom-http-agent-responses.mocks';
import {mockCanisterId} from './mocks/icrc-accounts.mocks';
import type {RelyingPartyOptions} from './types/relying-party-options';
import {JSON_RPC_VERSION_2} from './types/rpc';
import * as callUtils from './utils/call.utils';

vi.mock('@dfinity/agent', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const originalModule = await importOriginal<typeof import('@dfinity/agent')>();

  class MockHttpAgent {
    call = vi.fn();
    create = vi.fn();

    get rootKey(): ArrayBuffer {
      return mockLocalIcRootKey.buffer;
    }
  }

  Object.defineProperty(MockHttpAgent, 'create', {
    value: vi.fn().mockResolvedValue(new MockHttpAgent()),
    writable: true
  });

  return {
    ...originalModule,
    HttpAgent: MockHttpAgent,
    pollForResponse: vi.fn()
  };
});

describe('icp-wallet', () => {
  const mockParameters: RelyingPartyOptions = {url: 'https://test.com'};

  const messageEventReady = new MessageEvent('message', {
    origin: mockParameters.url,
    data: {
      jsonrpc: JSON_RPC_VERSION_2,
      id: crypto.randomUUID(),
      result: 'ready'
    }
  });

  let originalOpen: typeof window.open;
  let icpWallet: IcpWallet;

  beforeEach(async () => {
    vi.setSystemTime(mockLocalCallTime);

    originalOpen = window.open;

    vi.stubGlobal(
      'open',
      vi.fn(() => window)
    );
    vi.stubGlobal('close', vi.fn());
    vi.stubGlobal('focus', vi.fn());

    const promise = IcpWallet.connect(mockParameters);

    window.dispatchEvent(messageEventReady);

    icpWallet = await promise;
  });

  afterEach(async () => {
    window.open = originalOpen;

    await icpWallet.disconnect();

    vi.clearAllMocks();
    vi.useRealTimers();
  });

  // TODO: implement same tests as "Connection errors" and "Connection success" for IcpWallet as in RelyingParty spec

  describe('icrc1Transfer', () => {
    const request: Icrc1TransferRequest = {
      to: {
        owner: mockLocalRelyingPartyPrincipal,
        subaccount: toNullable()
      },
      amount: 5000000n
    };

    const {sender} = mockLocalCallParams;

    it('should call `call` with the correct parameters when icrc1Transfer is invoked', async () => {
      const mockCall = vi.fn().mockResolvedValue(mockLocalCallResult);

      icpWallet.call = mockCall;

      const result = await icpWallet.icrc1Transfer({request, owner: sender});

      expect(result).toEqual(mockLocalBlockHeight);

      expect(mockCall).toHaveBeenCalledWith({
        params: mockLocalCallParams
      });
    });

    it('should call `call` with the specific canister ID', async () => {
      const mockCall = vi.fn().mockResolvedValue({});

      icpWallet.call = mockCall;

      vi.spyOn(callUtils, 'decodeResponse').mockResolvedValue({Ok: mockLocalBlockHeight});

      await icpWallet.icrc1Transfer({request, owner: sender, ledgerCanisterId: mockCanisterId});

      expect(mockCall).toHaveBeenCalledWith({
        params: {
          ...mockLocalCallParams,
          canisterId: mockCanisterId
        }
      });
    });

    it('should call `call` with the specific sender', async () => {
      const mockCall = vi.fn().mockResolvedValue({});

      icpWallet.call = mockCall;

      vi.spyOn(callUtils, 'decodeResponse').mockResolvedValue({Ok: mockLocalBlockHeight});

      const owner = Ed25519KeyIdentity.generate().getPrincipal().toText();

      await icpWallet.icrc1Transfer({request, owner});

      expect(mockCall).toHaveBeenCalledWith({
        params: {
          ...mockLocalCallParams,
          sender: owner
        }
      });
    });
  });
});
