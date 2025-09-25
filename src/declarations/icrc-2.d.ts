import type {ActorMethod} from '@icp-sdk/core/agent';
import type {IDL} from '@icp-sdk/core/candid';
import type {Principal} from '@icp-sdk/core/principal';

export interface Account {
  owner: Principal;
  subaccount: [] | [Uint8Array | number[]];
}
export interface AllowanceArgs {
  account: Account;
  spender: Account;
}
export interface ApproveArgs {
  fee: [] | [bigint];
  memo: [] | [Uint8Array | number[]];
  from_subaccount: [] | [Uint8Array | number[]];
  created_at_time: [] | [bigint];
  amount: bigint;
  expected_allowance: [] | [bigint];
  expires_at: [] | [bigint];
  spender: Account;
}
export type ApproveError =
  | {
      GenericError: {message: string; error_code: bigint};
    }
  | {TemporarilyUnavailable: null}
  | {Duplicate: {duplicate_of: bigint}}
  | {BadFee: {expected_fee: bigint}}
  | {AllowanceChanged: {current_allowance: bigint}}
  | {CreatedInFuture: {ledger_time: bigint}}
  | {TooOld: null}
  | {Expired: {ledger_time: bigint}}
  | {InsufficientFunds: {balance: bigint}};
export interface TransferFromArgs {
  to: Account;
  fee: [] | [bigint];
  spender_subaccount: [] | [Uint8Array | number[]];
  from: Account;
  memo: [] | [Uint8Array | number[]];
  created_at_time: [] | [bigint];
  amount: bigint;
}
export type TransferFromError =
  | {
      GenericError: {message: string; error_code: bigint};
    }
  | {TemporarilyUnavailable: null}
  | {InsufficientAllowance: {allowance: bigint}}
  | {BadBurn: {min_burn_amount: bigint}}
  | {Duplicate: {duplicate_of: bigint}}
  | {BadFee: {expected_fee: bigint}}
  | {CreatedInFuture: {ledger_time: bigint}}
  | {TooOld: null}
  | {InsufficientFunds: {balance: bigint}};
export interface _SERVICE {
  icrc1_supported_standards: ActorMethod<[], Array<{url: string; name: string}>>;
  icrc2_allowance: ActorMethod<[AllowanceArgs], {allowance: bigint; expires_at: [] | [bigint]}>;
  icrc2_approve: ActorMethod<[ApproveArgs], {Ok: bigint} | {Err: ApproveError}>;
  icrc2_transfer_from: ActorMethod<[TransferFromArgs], {Ok: bigint} | {Err: TransferFromError}>;
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: {IDL: typeof IDL}) => IDL.Type[];
