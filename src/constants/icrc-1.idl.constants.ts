import {IDL} from '@icp-sdk/core/candid';
import {Icrc1Idl} from '../declarations';

export const TransferResult = IDL.Variant({Ok: IDL.Nat, Err: Icrc1Idl.TransferError});
