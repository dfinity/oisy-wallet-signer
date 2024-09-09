import {IDL} from '@dfinity/candid';
import type {Icrc1TransferRequest} from '@dfinity/ledger-icp';
import {toIcrc1TransferRawRequest} from '@dfinity/ledger-icp/dist/types/canisters/ledger/ledger.request.converts';
import {RelyingParty} from './relying-party';

export class IcpWallet extends RelyingParty {
  // TODO: documentation
  // TODO: return BlockHeight?
  public icrc1Transfer = async (request: Icrc1TransferRequest): Promise<void> => {
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
        sender: account.owner,
        method: 'icrc1_transfer',
        canisterId: 'ryjl3-tyaaa-aaaaa-aaaba-cai',
        arg
      }
    });
  };
}
