import {Ed25519KeyIdentity} from '@dfinity/identity';
import {TransferParams} from '@dfinity/ledger-icrc';
import {toNullable} from '@dfinity/utils';
import {IcrcWallet} from './icrc-wallet';
import {
  mockLocalBlockHeight,
  mockLocalCallParams,
  mockLocalCallResult,
  mockLocalCallTime,
  mockLocalRelyingPartyPrincipal
} from './mocks/call-utils.mocks';
import {mockLocalIcRootKey} from './mocks/custom-http-agent-responses.mocks';
import {RelyingPartyWalletOptions} from './types/relying-party-wallet-options';
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

describe('icrc-wallet', () => {
  const mockParameters: RelyingPartyWalletOptions = {
    url: 'https://test.com',
    host: 'http://localhost:8080'
  };

  const mockCanisterId = 'ryjl3-tyaaa-aaaaa-aaaba-cai';

  const messageEventReady = new MessageEvent('message', {
    origin: mockParameters.url,
    data: {
      jsonrpc: JSON_RPC_VERSION_2,
      id: crypto.randomUUID(),
      result: 'ready'
    }
  });

  let originalOpen: typeof window.open;
  let icrcWallet: IcrcWallet;

  beforeEach(async () => {
    vi.setSystemTime(mockLocalCallTime);

    originalOpen = window.open;

    vi.stubGlobal(
      'open',
      vi.fn(() => window)
    );
    vi.stubGlobal('close', vi.fn());
    vi.stubGlobal('focus', vi.fn());

    const promise = IcrcWallet.connect(mockParameters);

    window.dispatchEvent(messageEventReady);

    icrcWallet = await promise;
  });

  afterEach(async () => {
    window.open = originalOpen;

    await icrcWallet.disconnect();

    vi.clearAllMocks();
    vi.useRealTimers();
  });

  // TODO: implement same tests as "Connection errors" and "Connection success" for IcpWallet as in RelyingParty spec

  describe('icrc1Transfer', () => {
    const params: TransferParams = {
      to: {
        owner: mockLocalRelyingPartyPrincipal,
        subaccount: toNullable()
      },
      amount: 5000000n
    };

    const mockIcrcLocalCallParams = {
      ...mockLocalCallParams,
      canisterId: mockCanisterId,
      arg: 'RElETAZte24AbAKzsNrDA2ithsqDBQFufW54bAb7ygECxvy2AgO6ieXCBAGi3pTrBgGC8/ORDATYo4yoDX0BBQEdP0Duk4WbdYJC1svDpO9SpE+aElxKU7FNBuH2LAIAAAAAAMCWsQI='
    };

    const {sender} = mockIcrcLocalCallParams;

    it('should call `call` with the correct parameters when transfer is invoked', async () => {
      const mockCall = vi.fn().mockResolvedValue(mockLocalCallResult);

      // @ts-expect-error we mock call for testing purposes
      icrcWallet.call = mockCall;

      const result = await icrcWallet.transfer({
        params,
        owner: sender,
        ledgerCanisterId: mockCanisterId
      });

      expect(result).toEqual(mockLocalBlockHeight);

      expect(mockCall).toHaveBeenCalledWith({
        params: {
          ...mockIcrcLocalCallParams
        }
      });
    });

    it('should call `call` with the specific sender', async () => {
      const mockCall = vi.fn().mockResolvedValue({});

      // @ts-expect-error we mock call for testing purposes
      icrcWallet.call = mockCall;

      vi.spyOn(callUtils, 'decodeResponse').mockResolvedValue({Ok: mockLocalBlockHeight});

      const owner = Ed25519KeyIdentity.generate().getPrincipal().toText();

      await icrcWallet.transfer({params, owner, ledgerCanisterId: mockCanisterId});

      expect(mockCall).toHaveBeenCalledWith({
        params: {
          ...mockIcrcLocalCallParams,
          sender: owner
        }
      });
    });

    it('should call `call` with the specific options', async () => {
      const mockCall = vi.fn().mockResolvedValue({});

      // @ts-expect-error we mock call for testing purposes
      icrcWallet.call = mockCall;

      vi.spyOn(callUtils, 'decodeResponse').mockResolvedValue({Ok: mockLocalBlockHeight});

      const options = {
        pollingIntervalInMilliseconds: 600,
        timeoutInMilliseconds: 120000
      };

      await icrcWallet.transfer({params, owner: sender, options, ledgerCanisterId: mockCanisterId});

      expect(mockCall).toHaveBeenCalledWith({
        params: mockIcrcLocalCallParams,
        options
      });
    });

    it('should call decode response with the specific host', async () => {
      const mockCall = vi.fn().mockResolvedValue({});

      // @ts-expect-error we mock call for testing purposes
      icrcWallet.call = mockCall;

      const spy = vi
        .spyOn(callUtils, 'decodeResponse')
        .mockResolvedValue({Ok: mockLocalBlockHeight});

      await icrcWallet.transfer({
        params,
        owner: sender,
        ledgerCanisterId: mockCanisterId
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          host: mockParameters.host
        })
      );
    });
  });
});
