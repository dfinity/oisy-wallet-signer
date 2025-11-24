import {IDL} from '@icp-sdk/core/candid';
// eslint-disable-next-line import/no-relative-parent-imports
import {TransferError} from '../declarations/icrc-1.idl';

export const TransferResult = IDL.Variant({Ok: IDL.Nat, Err: TransferError});
