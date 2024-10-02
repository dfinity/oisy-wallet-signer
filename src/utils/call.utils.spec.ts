import {TransferResult} from '../constants/icrc.idl.constants';
import {mockLocalIcRootKey} from '../mocks/custom-http-agent-responses.mocks';
import {IcrcCallCanisterRequestParams} from '../types/icrc-requests';
import {IcrcCallCanisterResult} from '../types/icrc-responses';
import {uint8ArrayToBase64} from './base64.utils';
import {assertCallArg, assertCallMethod, decodeResponse} from './call.utils';

vi.mock('@dfinity/agent', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const originalModule = await importOriginal<typeof import('@dfinity/agent')>();

  class MockHttpAgent {
    call = vi.fn();
    create = vi.fn();

    get rootKey(): ArrayBuffer {
      return mockLocalIcRootKey.buffer;
    }
  }

  Object.defineProperty(MockHttpAgent, 'create', {
    value: vi.fn().mockResolvedValue(new MockHttpAgent()),
    writable: true
  });

  return {
    ...originalModule,
    HttpAgent: MockHttpAgent,
    pollForResponse: vi.fn()
  };
});

describe('call.utils', () => {
  describe('assertCallMethod', () => {
    it('should not throw an error when methods match', () => {
      const requestMethod = 'icrc1_transfer';
      const responseMethod = 'icrc1_transfer';

      expect(() => assertCallMethod({requestMethod, responseMethod})).not.toThrow();
    });

    it('should throw an error when methods do not match', () => {
      const requestMethod = 'icrc1_transfer';
      const responseMethod = 'test';

      expect(() => assertCallMethod({requestMethod, responseMethod})).toThrow(
        'The response method does not match the request method.'
      );
    });
  });

  describe('assertCallArg', () => {
    it('should not throw an error when arguments match', () => {
      const responseArg = new Uint8Array([1, 2, 3, 4, 5, 6, 7]);
      const requestArgBlob = uint8ArrayToBase64(responseArg);

      expect(() =>
        assertCallArg({
          requestArg: requestArgBlob,
          responseArg
        })
      ).not.toThrow();
    });

    it('should throw an error when arguments do not match', () => {
      const responseArg = new Uint8Array([1, 2, 3, 4, 5, 6, 7]);
      const requestArgBlob = uint8ArrayToBase64(new Uint8Array([1, 2, 3]));

      expect(() =>
        assertCallArg({
          requestArg: requestArgBlob,
          responseArg
        })
      ).toThrow('The response does not contain the request arguments.');
    });
  });

  describe('decodeResponse', () => {
    it('should decode success response', async () => {
      // Observed values while testing locally.

      const callParams: IcrcCallCanisterRequestParams = {
        arg: 'RElETAZte24AbAKzsNrDA2ithsqDBQFufW54bAb7ygECxvy2AgO6ieXCBAGi3pTrBgGC8/ORDATYo4yoDX0BBQEdP0Duk4WbdYJC1svDpO9SpE+aElxKU7FNBuH2LAIAAZBOAAAAwJaxAg==',
        canisterId: 'ryjl3-tyaaa-aaaaa-aaaba-cai',
        method: 'icrc1_transfer',
        sender: 'f2uoh-ddrrp-y5mqp-dwbtm-y67ln-pslmx-esrv3-ttjch-uvxie-mvgcb-4qe'
      };

      const callResult: IcrcCallCanisterResult = {
        certificate:
          '2dn3omlzaWduYXR1cmVYMIRlD8DyLTRm4cNY6ZYOIyTx/5MZ7bGHm2unaMz/78KwFhA++pJExycUC+ZdrleFtGR0cmVlgwGDAYIEWCBnoHoMNr/grlp/CTec5CDL8m2lBsedNjlIbnPEmQxfw4MBggRYIPQ0BrYO1QSm0QyNoDRxrTtwUFsidOwark3+6UV+JtxcgwJOcmVxdWVzdF9zdGF0dXODAYMBggRYIHmgpM2nhmBMmPTLNI4WwCwObyUBWpO58wQwfhjJhJDAgwGDAlggQBd9b5Wer4jblY8wZ41iWRNkXZT9L37cT9l1rL+cJv+DAYMCRXJlcGx5ggNYe0RJREwIawK8igF9xf7SAQFrCNHEmHwCwpHsuQJ/lMHHiQQD64KolwQEocPr/QcF8Ifm2wkGk+W+yAx/65zb1Q8HbALH68TQCXHEmLG1DX1sAZuzvqYKfWwBi73ymwF9bAG/m7fwDX1sAaO7kYwKeGwBnLq2nAJ9AQAAcoMCRnN0YXR1c4IDR3JlcGxpZWSCBFggf+PvzTp6ZYO4iR1pdq/Y8YNeG4MEPJXP4L8gGVbqOZmCBFggVwwB8Q5BRZqLTjr4nQIwBlx0QLT5Tm15csdqVWMZWn2DAYIEWCDf3DBRUg7g1jtKxYGDfk+uS85noU/fMxkHfyyhi82vfoMCRHRpbWWCA0nezZjXi6ip/Rc=',
        contentMap:
          '2dn3p2NhcmdYakRJREwGbXtuAGwCs7DawwNorYbKgwUBbn1ueGwG+8oBAsb8tgIDuonlwgQBot6U6wYBgvPzkQwE2KOMqA19AQUBHT9A7pOFm3WCQtbLw6TvUqRPmhJcSlOxTQbh9iwCAAGQTgAAAMCWsQJrY2FuaXN0ZXJfaWRKAAAAAAAAAAIBAW5pbmdyZXNzX2V4cGlyeRsX+qVy6MOwAGttZXRob2RfbmFtZW5pY3JjMV90cmFuc2ZlcmVub25jZVCS+EllEG6amSrgQoR0nIAabHJlcXVlc3RfdHlwZWRjYWxsZnNlbmRlclgdcYvx1kHjsGbMe+tr5LZcko13OaRHpW6CMqYQeQI='
      };

      const response = await decodeResponse({
        params: callParams,
        result: callResult,
        resultRecordClass: TransferResult
      });

      expect(response).toEqual({});
    });
  });
});
