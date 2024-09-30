import {IDL} from '@dfinity/candid';
import {TransferParams} from '@dfinity/ledger-icrc';
import {toTransferArg} from '@dfinity/ledger-icrc/dist/types/converters/ledger.converters';
import type {
  IcrcAccount,
  IcrcCallCanisterResult,
  Origin,
  PrincipalText,
  RelyingPartyOptions
} from './index';
import {RelyingParty} from './relying-party';
import {uint8ArrayToBase64} from './utils/base64.utils';

export class IcrcWallet extends RelyingParty {
  /**
   * Establishes a connection with an ICRC Wallet.
   *
   * @override
   * @static
   * @param {RelyingPartyOptions} options - The options to initialize the ICRC Wallet signer.
   * @returns {Promise<IcrcWallet>} A promise that resolves to an object, which can be used to interact with the ICRC Wallet when it is connected.
   */
  static async connect(options: RelyingPartyOptions): Promise<IcrcWallet> {
    return await this.connectSigner({
      options,
      init: (params: {origin: Origin; popup: Window}) => new IcrcWallet(params)
    });
  }

  transfer = async ({
    params,
    owner,
    ledgerCanisterId: canisterId
  }: {params: TransferParams; ledgerCanisterId: PrincipalText} & Pick<
    IcrcAccount,
    'owner'
  >): Promise<IcrcCallCanisterResult> => {
    // TODO: this should be exposed by Candid IDL
    const Subaccount = IDL.Vec(IDL.Nat8);

    const Tokens = IDL.Nat;

    const Timestamp = IDL.Nat64;

    const Account = IDL.Record({
      owner: IDL.Principal,
      subaccount: IDL.Opt(Subaccount)
    });

    const TransferArg = IDL.Record({
      to: Account,
      fee: IDL.Opt(Tokens),
      memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
      from_subaccount: IDL.Opt(Subaccount),
      created_at_time: IDL.Opt(Timestamp),
      amount: Tokens
    });

    const rawArg = toTransferArg(params);

    const arg = uint8ArrayToBase64(new Uint8Array(IDL.encode([TransferArg], [rawArg])));

    return await this.call({
      params: {
        sender: owner,
        method: 'icrc1_transfer',
        canisterId,
        arg
      }
    });
  };
}
