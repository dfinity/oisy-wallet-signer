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

const ApproveError = IDL.Variant({
  GenericError: IDL.Record({
    message: IDL.Text,
    error_code: IDL.Nat
  }),
  TemporarilyUnavailable: IDL.Null,
  Duplicate: IDL.Record({duplicate_of: IDL.Nat}),
  BadFee: IDL.Record({expected_fee: IDL.Nat}),
  AllowanceChanged: IDL.Record({current_allowance: IDL.Nat}),
  CreatedInFuture: IDL.Record({ledger_time: IDL.Nat64}),
  TooOld: IDL.Null,
  Expired: IDL.Record({ledger_time: IDL.Nat64}),
  InsufficientFunds: IDL.Record({balance: IDL.Nat})
});

export const ApproveResult = IDL.Variant({Ok: IDL.Nat, Err: ApproveError});
