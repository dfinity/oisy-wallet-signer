import {Principal} from '@dfinity/principal';
import {TransferArgs} from '../constants/icrc.idl.constants';
import {TransferArgs as TransferArgsType} from '../declarations/icrc-1';
import {encodeArg} from './call.utils';

describe('call.utils', () => {
  it('should encode arguments', () => {
    const rawArgs: TransferArgsType = {
      amount: 5000000n,
      created_at_time: [1727696940356000000n],
      fee: [10000n],
      from_subaccount: [],
      memo: [],
      to: {
        owner: Principal.fromText(
          'ids2f-skxn7-4uwrl-lgtdm-mcv3m-m324f-vjn73-xg6xq-uea7b-37klk-nqe'
        ),
        subaccount: []
      }
    };

    const arg = encodeArg({
      recordClass: TransferArgs,
      rawArgs
    });

    expect(arg).toEqual(
      'RElETAZte24AbAKzsNrDA2ithsqDBQFufW54bAb7ygECxvy2AgO6ieXCBAGi3pTrBgGC8/ORDATYo4yoDX0BBQEdV2/5S0VrNMbGCrtjN64WqW/3c3rwoQHw7+pamwIAAZBOAAABANlyqTYD+hfAlrEC'
    );
  });
});
