import {IDL} from '@icp-sdk/core/candid';
import {ApproveError, TransferFromError} from '../declarations/icrc-2.idl';

export const ApproveResult = IDL.Variant({Ok: IDL.Nat, Err: ApproveError});
export const TransferFromResult = IDL.Variant({Ok: IDL.Nat, Err: TransferFromError});
