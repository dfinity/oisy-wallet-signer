import * as candid from '@icp-sdk/core/candid';
import {Principal} from '@icp-sdk/core/principal';
import {Icrc1Idl, type Icrc1Did} from '../declarations';
import {decodeIdl, encodeIdl} from './idl.utils';

vi.mock('@icp-sdk/core/candid', async (importOriginal) => {
  const actual = await importOriginal<typeof candid>();
  return {
    ...actual,
    IDL: {
      ...actual.IDL,
      decode: vi.fn(actual.IDL.decode)
    }
  };
});

describe('idl.utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('encodeArg', () => {
    it('should encode arguments', () => {
      const rawArgs: Icrc1Did.TransferArgs = {
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
        recordClass: Icrc1Idl.TransferArgs,
        rawArgs
      });

      expect(arg).toEqual(
        'RElETAZte24AbAKzsNrDA2ithsqDBQFufW54bAb7ygECxvy2AgO6ieXCBAGi3pTrBgGC8/ORDATYo4yoDX0BBQEdV2/5S0VrNMbGCrtjN64WqW/3c3rwoQHw7+pamwIAAZBOAAABANlyqTYD+hfAlrEC'
      );
    });
  });

  describe('decodeResult', () => {
    const mockRecordClass = candid.IDL.Record({someField: candid.IDL.Text});

    it('should decode the bytes and return the result', () => {
      const mockExpectedObject = {someField: 'test value'};
      const mockReply = candid.IDL.encode([mockRecordClass], [mockExpectedObject]);

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
      ).toThrowError(/Wrong magic number/);
    });

    it('should throw an error if more than one object is returned', () => {
      const mockReply = new Uint8Array(10);

      vi.spyOn(candid.IDL, 'decode').mockReturnValue([
        {someField: 'value1'},
        {someField: 'value2'}
      ]);

      expect(() =>
        decodeIdl({
          recordClass: mockRecordClass,
          bytes: mockReply
        })
      ).toThrowError('More than one object returned. This is unexpected.');
    });
  });
});
