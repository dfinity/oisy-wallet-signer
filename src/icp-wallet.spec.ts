import type * as agent from '@icp-sdk/core/agent';
import {Ed25519KeyIdentity} from '@icp-sdk/core/identity';
import type {Icrc1TransferRequest, Icrc2ApproveRequest} from '@dfinity/ledger-icp';
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
import {
  mockIcrc2ApproveLocalBlockHeight,
  mockIcrc2ApproveLocalCallParams,
  mockIcrc2ApproveLocalCallResult,
  mockIcrc2ApproveLocalCallTime,
  mockIcrc2LocalIcRootKey,
  mockIcrc2LocalRelyingPartyPrincipal
} from './mocks/icrc2-call-utils.mocks';
import type {RelyingPartyOptions} from './types/relying-party-options';
import {JSON_RPC_VERSION_2} from './types/rpc';
import * as callUtils from './utils/call.utils';

const mocks = vi.hoisted(() => ({getRootKey: vi.fn()}));

vi.mock('@icp-sdk/core/agent', async (importOriginal) => {
  const originalModule = await importOriginal<typeof agent>();

  class MockHttpAgent {
    call = vi.fn();
    create = vi.fn();

    get rootKey(): Uint8Array {
      return mocks.getRootKey();
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
  let icpWallet: IcpWallet;

  beforeEach(async () => {
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

    beforeEach(() => {
      vi.setSystemTime(mockLocalCallTime);

      mocks.getRootKey.mockReturnValue(mockLocalIcRootKey);
    });

    it('should call `call` with the correct parameters when icrc1Transfer is invoked', async () => {
      const mockCall = vi.fn().mockResolvedValue(mockLocalCallResult);

      // @ts-expect-error we mock call for testing purposes
      icpWallet.call = mockCall;

      const result = await icpWallet.icrc1Transfer({request, owner: sender});

      expect(result).toEqual(mockLocalBlockHeight);

      expect(mockCall).toHaveBeenCalledWith({
        params: mockLocalCallParams
      });
    });

    it('should call `call` with the specific canister ID', async () => {
      const mockCall = vi.fn().mockResolvedValue({});

      // @ts-expect-error we mock call for testing purposes
      icpWallet.call = mockCall;

      const spy = vi
        .spyOn(callUtils, 'decodeResponse')
        .mockResolvedValue({Ok: mockLocalBlockHeight});

      await icpWallet.icrc1Transfer({request, owner: sender, ledgerCanisterId: mockCanisterId});

      expect(mockCall).toHaveBeenCalledWith({
        params: {
          ...mockLocalCallParams,
          canisterId: mockCanisterId
        }
      });

      spy.mockRestore();
    });

    it('should call `call` with the specific sender', async () => {
      const mockCall = vi.fn().mockResolvedValue({});

      // @ts-expect-error we mock call for testing purposes
      icpWallet.call = mockCall;

      const spy = vi
        .spyOn(callUtils, 'decodeResponse')
        .mockResolvedValue({Ok: mockLocalBlockHeight});

      const owner = Ed25519KeyIdentity.generate().getPrincipal().toText();

      await icpWallet.icrc1Transfer({request, owner});

      expect(mockCall).toHaveBeenCalledWith({
        params: {
          ...mockLocalCallParams,
          sender: owner
        }
      });

      spy.mockRestore();
    });

    it('should call `call` with the specific options', async () => {
      const mockCall = vi.fn().mockResolvedValue({});

      // @ts-expect-error we mock call for testing purposes
      icpWallet.call = mockCall;

      const spy = vi
        .spyOn(callUtils, 'decodeResponse')
        .mockResolvedValue({Ok: mockLocalBlockHeight});

      const options = {
        pollingIntervalInMilliseconds: 600,
        timeoutInMilliseconds: 120000
      };

      await icpWallet.icrc1Transfer({request, owner: sender, options});

      expect(mockCall).toHaveBeenCalledWith({
        params: mockLocalCallParams,
        options
      });

      spy.mockRestore();
    });

    it('should call decode response with the specific host', async () => {
      const mockCall = vi.fn().mockResolvedValue({});

      // @ts-expect-error we mock call for testing purposes
      icpWallet.call = mockCall;

      const spy = vi
        .spyOn(callUtils, 'decodeResponse')
        .mockResolvedValue({Ok: mockLocalBlockHeight});

      await icpWallet.icrc1Transfer({request, owner: sender});

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          host: mockParameters.host
        })
      );

      spy.mockRestore();
    });
  });

  describe('icrc2Approve', () => {
    const request: Icrc2ApproveRequest = {
      spender: {
        owner: mockIcrc2LocalRelyingPartyPrincipal,
        subaccount: toNullable()
      },
      amount: 50000000n,
      fee: 10000n
    };

    const {sender} = mockIcrc2ApproveLocalCallParams;

    beforeEach(() => {
      vi.setSystemTime(mockIcrc2ApproveLocalCallTime);

      mocks.getRootKey.mockReturnValue(mockIcrc2LocalIcRootKey);
    });

    it('should call `call` with the correct parameters when icrc1Approve is invoked', async () => {
      const mockCall = vi.fn().mockResolvedValue(mockIcrc2ApproveLocalCallResult);

      // @ts-expect-error we mock call for testing purposes
      icpWallet.call = mockCall;

      const result = await icpWallet.icrc2Approve({request, owner: sender});

      expect(result).toEqual(mockIcrc2ApproveLocalBlockHeight);

      expect(mockCall).toHaveBeenCalledWith({
        params: mockIcrc2ApproveLocalCallParams
      });
    });

    it('should call `call` with the specific canister ID', async () => {
      const mockCall = vi.fn().mockResolvedValue({});

      // @ts-expect-error we mock call for testing purposes
      icpWallet.call = mockCall;

      const spy = vi
        .spyOn(callUtils, 'decodeResponse')
        .mockResolvedValue({Ok: mockIcrc2ApproveLocalBlockHeight});

      await icpWallet.icrc2Approve({request, owner: sender, ledgerCanisterId: mockCanisterId});

      expect(mockCall).toHaveBeenCalledWith({
        params: {
          ...mockIcrc2ApproveLocalCallParams,
          canisterId: mockCanisterId
        }
      });

      spy.mockRestore();
    });

    it('should call `call` with the specific sender', async () => {
      const mockCall = vi.fn().mockResolvedValue({});

      // @ts-expect-error we mock call for testing purposes
      icpWallet.call = mockCall;

      const spy = vi
        .spyOn(callUtils, 'decodeResponse')
        .mockResolvedValue({Ok: mockIcrc2ApproveLocalBlockHeight});

      const owner = Ed25519KeyIdentity.generate().getPrincipal().toText();

      await icpWallet.icrc2Approve({request, owner});

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
      icpWallet.call = mockCall;

      const spy = vi
        .spyOn(callUtils, 'decodeResponse')
        .mockResolvedValue({Ok: mockIcrc2ApproveLocalBlockHeight});

      const options = {
        pollingIntervalInMilliseconds: 600,
        timeoutInMilliseconds: 120000
      };

      await icpWallet.icrc2Approve({request, owner: sender, options});

      expect(mockCall).toHaveBeenCalledWith({
        params: mockIcrc2ApproveLocalCallParams,
        options
      });

      spy.mockRestore();
    });

    it('should call decode response with the specific host', async () => {
      const mockCall = vi.fn().mockResolvedValue({});

      // @ts-expect-error we mock call for testing purposes
      icpWallet.call = mockCall;

      const spy = vi
        .spyOn(callUtils, 'decodeResponse')
        .mockResolvedValue({Ok: mockIcrc2ApproveLocalBlockHeight});

      await icpWallet.icrc2Approve({request, owner: sender});

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          host: mockParameters.host
        })
      );

      spy.mockRestore();
    });
  });
});
