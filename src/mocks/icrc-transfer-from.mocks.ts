import {Principal} from '@icp-sdk/core/principal';
import {type Icrc2Did, Icrc2Idl} from '../declarations';
import {encodeIdl} from '../utils/idl.utils';
import {mockLocalRelyingPartyPrincipal} from './call-utils.mocks';
import {mockPrincipalText} from './icrc-accounts.mocks';

export const mockIcrcTransferFromRawArgs: Icrc2Did.TransferFromArgs = {
  amount: 320_678_001n,
  created_at_time: [1727696940356000000n],
  fee: [100_440n],
  spender_subaccount: [],
  from: {
    owner: Principal.fromText(mockPrincipalText),
    subaccount: []
  },
  to: {
    owner: mockLocalRelyingPartyPrincipal,
    subaccount: []
  },
  memo: []
};

export const mockIcrcTransferFromArg = encodeIdl({
  recordClass: Icrc2Idl.TransferFromArgs,
  rawArgs: mockIcrcTransferFromRawArgs
});
