import {Ed25519KeyIdentity} from '@dfinity/identity';
import type {Icrc1TransferRequest} from '@dfinity/ledger-icp';
import {Principal} from '@dfinity/principal';
import {toNullable} from '@dfinity/utils';
import {IcpWallet} from './icp-wallet';
import {mockCanisterId, mockPrincipalText} from './mocks/icrc-accounts.mocks';
import type {RelyingPartyOptions} from './types/relying-party-options';
import {JSON_RPC_VERSION_2} from './types/rpc';
import {uint8ArrayToBase64} from './utils/base64.utils';

vi.mock('@dfinity/candid', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const originalModule = await importOriginal<typeof import('@dfinity/candid')>();

  return {
    ...originalModule,
    IDL: {
      ...originalModule.IDL,
      encode: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3, 5, 6, 9, 9, 9]))
    }
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

    vi.clearAllMocks();

    await icpWallet.disconnect();
  });

  describe('icrc1Transfer', () => {
    const request: Icrc1TransferRequest = {
      to: {
        owner: Principal.fromText(mockPrincipalText),
        subaccount: toNullable()
      },
      amount: 123n,
      fee: 1n
    };

    it('should call `call` with the correct parameters when icrc1Transfer is invoked', async () => {
      const mockCall = vi.fn().mockResolvedValue({});

      icpWallet.call = mockCall;

      const owner = Ed25519KeyIdentity.generate().getPrincipal().toText();

      await icpWallet.icrc1Transfer({request, owner});

      expect(mockCall).toHaveBeenCalledWith({
        params: {
          sender: owner,
          method: 'icrc1_transfer',
          canisterId: 'ryjl3-tyaaa-aaaaa-aaaba-cai',
          arg: uint8ArrayToBase64(new Uint8Array([1, 2, 3, 5, 6, 9, 9, 9]))
        }
      });
    });

    it('should call `call` with the specific canister ID', async () => {
      const mockCall = vi.fn().mockResolvedValue({});

      icpWallet.call = mockCall;

      const owner = Ed25519KeyIdentity.generate().getPrincipal().toText();

      await icpWallet.icrc1Transfer({request, owner, ledgerCanisterId: mockCanisterId});

      expect(mockCall).toHaveBeenCalledWith({
        params: {
          sender: owner,
          method: 'icrc1_transfer',
          canisterId: mockCanisterId,
          arg: uint8ArrayToBase64(new Uint8Array([1, 2, 3, 5, 6, 9, 9, 9]))
        }
      });
    });
  });
});
