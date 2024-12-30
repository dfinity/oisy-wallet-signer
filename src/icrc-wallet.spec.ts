import {Ed25519KeyIdentity} from '@dfinity/identity';
import {ApproveParams, TransferParams} from '@dfinity/ledger-icrc';
import {toNullable} from '@dfinity/utils';
import {IcrcWallet} from './icrc-wallet';
import {
  mockLocalBlockHeight,
  mockLocalCallResult,
  mockLocalCallTime,
  mockLocalRelyingPartyPrincipal
} from './mocks/call-utils.mocks';
import {mockLocalIcRootKey} from './mocks/custom-http-agent-responses.mocks';
import {mockIcrcLocalCallParams, mockLedgerCanisterId} from './mocks/icrc-call-utils.mocks';
import {
  mockIcrc2ApproveLocalBlockHeight,
  mockIcrc2ApproveLocalCallParams,
  mockIcrc2ApproveLocalCallResult,
  mockIcrc2ApproveLocalCallTime,
  mockIcrc2ApproveLocalIcRootKey,
  mockIcrc2ApproveLocalRelyingPartyPrincipal
} from './mocks/icrc2-approve-call-utils.mocks';
import {RelyingPartyOptions} from './types/relying-party-options';
import {JSON_RPC_VERSION_2} from './types/rpc';
import * as callUtils from './utils/call.utils';

const mocks = vi.hoisted(() => {
  return {getRootKey: vi.fn()};
});

vi.mock('@dfinity/agent', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const originalModule = await importOriginal<typeof import('@dfinity/agent')>();

  class MockHttpAgent {
    call = vi.fn();
    create = vi.fn();

    get rootKey(): ArrayBuffer {
      return mocks.getRootKey().buffer;
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
  const mockParameters: RelyingPartyOptions = {
    url: 'https://test.com',
    host: 'http://localhost:8080'
  };

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

  describe('transfer', () => {
    const params: TransferParams = {
      to: {
        owner: mockLocalRelyingPartyPrincipal,
        subaccount: toNullable()
      },
      amount: 5000000n
    };

    const {sender} = mockIcrcLocalCallParams;

    beforeEach(() => {
      vi.setSystemTime(mockLocalCallTime);

      mocks.getRootKey.mockReturnValue(mockLocalIcRootKey);
    });

    it('should call `call` with the correct parameters when transfer is invoked', async () => {
      const mockCall = vi.fn().mockResolvedValue(mockLocalCallResult);

      // @ts-expect-error we mock call for testing purposes
      icrcWallet.call = mockCall;

      const result = await icrcWallet.transfer({
        params,
        owner: sender,
        ledgerCanisterId: mockLedgerCanisterId
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

      const spy = vi
        .spyOn(callUtils, 'decodeResponse')
        .mockResolvedValue({Ok: mockLocalBlockHeight});

      const owner = Ed25519KeyIdentity.generate().getPrincipal().toText();

      await icrcWallet.transfer({params, owner, ledgerCanisterId: mockLedgerCanisterId});

      expect(mockCall).toHaveBeenCalledWith({
        params: {
          ...mockIcrcLocalCallParams,
          sender: owner
        }
      });

      spy.mockRestore();
    });

    it('should call `call` with the specific options', async () => {
      const mockCall = vi.fn().mockResolvedValue({});

      // @ts-expect-error we mock call for testing purposes
      icrcWallet.call = mockCall;

      const spy = vi
        .spyOn(callUtils, 'decodeResponse')
        .mockResolvedValue({Ok: mockLocalBlockHeight});

      const options = {
        pollingIntervalInMilliseconds: 600,
        timeoutInMilliseconds: 120000
      };

      await icrcWallet.transfer({
        params,
        owner: sender,
        options,
        ledgerCanisterId: mockLedgerCanisterId
      });

      expect(mockCall).toHaveBeenCalledWith({
        params: mockIcrcLocalCallParams,
        options
      });

      spy.mockRestore();
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
        ledgerCanisterId: mockLedgerCanisterId
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          host: mockParameters.host
        })
      );

      spy.mockRestore();
    });
  });

  describe('approve', () => {
    const params: ApproveParams = {
      spender: {
        owner: mockIcrc2ApproveLocalRelyingPartyPrincipal,
        subaccount: toNullable()
      },
      amount: 50000000n,
      fee: 10000n
    };

    const {sender} = mockIcrc2ApproveLocalCallParams;

    beforeEach(() => {
      vi.setSystemTime(mockIcrc2ApproveLocalCallTime);

      mocks.getRootKey.mockReturnValue(mockIcrc2ApproveLocalIcRootKey);
    });

    it('should call `call` with the correct parameters when approve is invoked', async () => {
      const mockCall = vi.fn().mockResolvedValue(mockIcrc2ApproveLocalCallResult);

      // @ts-expect-error we mock call for testing purposes
      icrcWallet.call = mockCall;

      const result = await icrcWallet.approve({
        params,
        owner: sender,
        ledgerCanisterId: mockLedgerCanisterId
      });

      expect(result).toEqual(mockIcrc2ApproveLocalBlockHeight);

      expect(mockCall).toHaveBeenCalledWith({
        params: {
          ...mockIcrc2ApproveLocalCallParams
        }
      });
    });

    it('should call `call` with the specific sender', async () => {
      const mockCall = vi.fn().mockResolvedValue({});

      // @ts-expect-error we mock call for testing purposes
      icrcWallet.call = mockCall;

      const spy = vi.spyOn(callUtils, 'decodeResponse').mockResolvedValue({
        Ok: mockIcrc2ApproveLocalBlockHeight
      });

      const owner = Ed25519KeyIdentity.generate().getPrincipal().toText();

      await icrcWallet.approve({params, owner, ledgerCanisterId: mockLedgerCanisterId});

      expect(mockCall).toHaveBeenCalledWith({
        params: {
          ...mockIcrc2ApproveLocalCallParams,
          sender: owner
        }
      });

      spy.mockRestore();
    });

    it('should call `call` with the specific options', async () => {
      const mockCall = vi.fn().mockResolvedValue({});

      // @ts-expect-error we mock call for testing purposes
      icrcWallet.call = mockCall;

      const spy = vi.spyOn(callUtils, 'decodeResponse').mockResolvedValue({
        Ok: mockIcrc2ApproveLocalBlockHeight
      });

      const options = {
        pollingIntervalInMilliseconds: 600,
        timeoutInMilliseconds: 120000
      };

      await icrcWallet.approve({
        params,
        owner: sender,
        options,
        ledgerCanisterId: mockLedgerCanisterId
      });

      expect(mockCall).toHaveBeenCalledWith({
        params: mockIcrc2ApproveLocalCallParams,
        options
      });

      spy.mockRestore();
    });

    it('should call decode response with the specific host', async () => {
      const mockCall = vi.fn().mockResolvedValue({});

      // @ts-expect-error we mock call for testing purposes
      icrcWallet.call = mockCall;

      const spy = vi
        .spyOn(callUtils, 'decodeResponse')
        .mockResolvedValue({Ok: mockIcrc2ApproveLocalBlockHeight});

      await icrcWallet.approve({
        params,
        owner: sender,
        ledgerCanisterId: mockLedgerCanisterId
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          host: mockParameters.host
        })
      );

      spy.mockRestore();
    });
  });
});
