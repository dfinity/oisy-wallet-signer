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


export const TransferError = IDL.Variant({
  GenericError: IDL.Record({
    message: IDL.Text,
    error_code: IDL.Nat
  }),
  TemporarilyUnavailable: IDL.Null,
  BadBurn: IDL.Record({min_burn_amount: IDL.Nat}),
  Duplicate: IDL.Record({duplicate_of: IDL.Nat}),
  BadFee: IDL.Record({expected_fee: IDL.Nat}),
  CreatedInFuture: IDL.Record({ledger_time: Timestamp}),
  TooOld: IDL.Null,
  InsufficientFunds: IDL.Record({balance: IDL.Nat})
});