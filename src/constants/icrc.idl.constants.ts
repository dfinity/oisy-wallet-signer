import {IDL} from '@dfinity/candid';

/**
 * TODO: All the constants of this module should be exposed by the IDL files - i.e. should be generated as exposed by didc
 */

const Subaccount = IDL.Vec(IDL.Nat8);
const Account = IDL.Record({
  owner: IDL.Principal,
  subaccount: IDL.Opt(Subaccount)
});

const Timestamp = IDL.Nat64;

export const TransferArgs = IDL.Record({
  to: Account,
  fee: IDL.Opt(IDL.Nat),
  memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
  from_subaccount: IDL.Opt(Subaccount),
  created_at_time: IDL.Opt(Timestamp),
  amount: IDL.Nat
});
