import {Principal} from '@dfinity/principal';
import {TransferFromArgs} from '../constants/icrc-2.idl.constants';
import {TransferFromArgs as TransferFromArgsType} from '../declarations/icrc-2';
import {encodeIdl} from '../utils/idl.utils';
import {mockLocalRelyingPartyPrincipal} from './call-utils.mocks';
import {mockPrincipalText} from './icrc-accounts.mocks';

export const mockIcrcTransferFromRawArgs: TransferFromArgsType = {
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
  recordClass: TransferFromArgs,
  rawArgs: mockIcrcTransferFromRawArgs
});
