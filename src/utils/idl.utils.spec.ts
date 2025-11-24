import {IDL} from '@icp-sdk/core/candid';
import {Principal} from '@icp-sdk/core/principal';
import type {TransferArgs as TransferArgsType} from '../declarations/icrc-1';
import {TransferArgs} from '../declarations/icrc-1.idl';
import {decodeIdl, encodeIdl} from './idl.utils';

describe('idl.utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('encodeArg', () => {
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

      const arg = encodeIdl({
        recordClass: TransferArgs,
        rawArgs
      });

      expect(arg).toEqual(
        'RElETAZte24AbAKzsNrDA2ithsqDBQFufW54bAb7ygECxvy2AgO6ieXCBAGi3pTrBgGC8/ORDATYo4yoDX0BBQEdV2/5S0VrNMbGCrtjN64WqW/3c3rwoQHw7+pamwIAAZBOAAABANlyqTYD+hfAlrEC'
      );
    });
  });

  describe('decodeResult', () => {
    const mockRecordClass = IDL.Record({someField: IDL.Text});

    it('should decode the bytes and return the result', () => {
      const mockExpectedObject = {someField: 'test value'};
      const mockReply = IDL.encode([mockRecordClass], [mockExpectedObject]);

      const result = decodeIdl<{someField: string}>({
        recordClass: mockRecordClass,
        bytes: mockReply
      });

      expect(result).toEqual(mockExpectedObject);
    });

    it('should throw an error when IDL.decode fails due to invalid reply', () => {
      const invalidReply = new Uint8Array(10);

      expect(() =>
        decodeIdl({
          recordClass: mockRecordClass,
          bytes: invalidReply
        })
      ).toThrow(/Wrong magic number/);
    });

    it('should throw an error if more than one object is returned', () => {
      const mockReply = new Uint8Array(10);

      // I'm not sure what pattern would lead decode to return a decoded JsonValue[] with more than one element.
      // I wonder if the type is correct; maybe the correct type should actually be [JsonValue].
      // Therefore, mocking agent-js decode for this particular test.
      vi.mock('@icp-sdk/core/candid', {spy: true});
      vi.mocked(IDL.decode).mockReturnValue([{someField: 'value1'}, {someField: 'value2'}]);

      expect(() =>
        decodeIdl({
          recordClass: mockRecordClass,
          bytes: mockReply
        })
      ).toThrow('More than one object returned. This is unexpected.');
    });
  });
});
