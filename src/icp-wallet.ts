import {IDL} from '@dfinity/candid';
import type {Icrc1TransferRequest} from '@dfinity/ledger-icp';
import {toIcrc1TransferRawRequest} from '@dfinity/ledger-icp/dist/types/canisters/ledger/ledger.request.converts';
import {RelyingParty} from './relying-party';
import {IcrcAccount} from './types/icrc-accounts';
import {PrincipalText} from './types/principal';

export class IcpWallet extends RelyingParty {
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
  } & Pick<IcrcAccount, 'owner'>): Promise<void> => {
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

    await this.call({
      params: {
        sender: owner,
        method: 'icrc1_transfer',
        // TODO: constant from ic-js
        canisterId: canisterId ?? 'ryjl3-tyaaa-aaaaa-aaaba-cai',
        arg
      }
    });
  };
}
