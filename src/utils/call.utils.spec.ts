import {uint8ArrayToBase64} from './base64.utils';
import {assertCallArg, assertCallMethod} from './call.utils';

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
});
