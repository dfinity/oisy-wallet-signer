import {IDL} from '@dfinity/candid';
import type {Icrc1TransferRequest} from '@dfinity/ledger-icp';
import {toIcrc1TransferRawRequest} from '@dfinity/ledger-icp/dist/types/canisters/ledger/ledger.request.converts';
import {RelyingParty} from './relying-party';
import type {IcrcAccount} from './types/icrc-accounts';
import type {IcrcCallCanisterResult} from './types/icrc-responses';
import type {PrincipalText} from './types/principal';
import type {RelyingPartyOptions} from './types/relying-party-options';

const ICP_LEDGER_CANISTER_ID = 'ryjl3-tyaaa-aaaaa-aaaba-cai';

export class IcpWallet extends RelyingParty {
  /**
   * Establishes a connection with an ICP Wallet.
   *
   * @override
   * @static
   * @param {RelyingPartyOptions} options - The options to initialize the ICP Wallet signer.
   * @returns {Promise<IcpWallet>} A promise that resolves to an object, which can be used to interact with the ICP Wallet when it is connected.
   */
  static async connect(options: RelyingPartyOptions): Promise<IcpWallet> {
    return await this.connectSigner({
      options,
      init: (params: {origin: string; popup: Window}) => new IcpWallet(params)
    });
  }

  // TODO: documentation
  // TODO: return BlockHeight?
  // TODO: zod but, we have to redeclare Icrc1TransferRequest
  public icrc1Transfer = async ({
    request,
    owner,
    canisterId
  }: {
    request: Icrc1TransferRequest;
    canisterId?: PrincipalText;
  } & Pick<IcrcAccount, 'owner'>): Promise<IcrcCallCanisterResult> => {
    // TODO: this should be exposed by Candid IDL
    const SubAccount = IDL.Vec(IDL.Nat8);

    const Icrc1Tokens = IDL.Nat;

    const Icrc1Timestamp = IDL.Nat64;

    const Account = IDL.Record({
      owner: IDL.Principal,
      subaccount: IDL.Opt(SubAccount)
    });

    const TransferArg = IDL.Record({
      to: Account,
      fee: IDL.Opt(Icrc1Tokens),
      memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
      from_subaccount: IDL.Opt(SubAccount),
      created_at_time: IDL.Opt(Icrc1Timestamp),
      amount: Icrc1Tokens
    });

    const rawRequest = toIcrc1TransferRawRequest(request);

    const arg = new Uint8Array(IDL.encode([TransferArg], [rawRequest]));

    return await this.call({
      params: {
        sender: owner,
        method: 'icrc1_transfer',
        canisterId: canisterId ?? ICP_LEDGER_CANISTER_ID,
        arg
      }
    });
  };
}
