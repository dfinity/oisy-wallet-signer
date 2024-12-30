import {IDL} from '@dfinity/candid';

/**
 * TODO: All the constants of this module should be exposed by the IDL files - i.e. should be generated as exposed by didc
 */

const Account = IDL.Record({
  owner: IDL.Principal,
  subaccount: IDL.Opt(IDL.Vec(IDL.Nat8))
});

export const ApproveArgs = IDL.Record({
  fee: IDL.Opt(IDL.Nat),
  memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
  from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  created_at_time: IDL.Opt(IDL.Nat64),
  amount: IDL.Nat,
  expected_allowance: IDL.Opt(IDL.Nat),
  expires_at: IDL.Opt(IDL.Nat64),
  spender: Account
});
