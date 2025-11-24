import {IDL} from '@icp-sdk/core/candid';
import {Icrc2Idl} from '../declarations';

export const ApproveResult = IDL.Variant({Ok: IDL.Nat, Err: Icrc2Idl.ApproveError});
export const TransferFromResult = IDL.Variant({Ok: IDL.Nat, Err: Icrc2Idl.TransferFromError});
