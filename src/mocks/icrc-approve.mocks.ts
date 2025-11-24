import {Principal} from '@icp-sdk/core/principal';
import {type Icrc2Did, Icrc2Idl} from '../declarations';
import {encodeIdl} from '../utils/idl.utils';
import {mockPrincipalText} from './icrc-accounts.mocks';

export const mockIcrcApproveRawArgs: Icrc2Did.ApproveArgs = {
  amount: 320_000_000_001n,
  created_at_time: [1727696940356000000n],
  fee: [100_330n],
  from_subaccount: [],
  memo: [],
  spender: {
    owner: Principal.fromText(mockPrincipalText),
    subaccount: []
  },
  expected_allowance: [],
  expires_at: []
};

export const mockIcrcApproveArg = encodeIdl({
  recordClass: Icrc2Idl.ApproveArgs,
  rawArgs: mockIcrcApproveRawArgs
});
