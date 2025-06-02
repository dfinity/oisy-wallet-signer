import {uint8ToBuf} from '@dfinity/agent';
import {Principal} from '@dfinity/principal';
import {uint8ArrayToBase64} from '@dfinity/utils';
import {mockCanisterId, mockPrincipalText} from '../mocks/icrc-accounts.mocks';
import {
  assertCallArg,
  assertCallCanisterId,
  assertCallMethod,
  assertCallSender
} from './call.assert.utils';

describe('call.assert.utils', () => {
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
          responseArg: uint8ToBuf(responseArg)
        })
      ).not.toThrow();
    });

    it('should throw an error when arguments do not match', () => {
      const responseArg = new Uint8Array([1, 2, 3, 4, 5, 6, 7]);
      const requestArgBlob = uint8ArrayToBase64(new Uint8Array([1, 2, 3]));

      expect(() =>
        assertCallArg({
          requestArg: requestArgBlob,
          responseArg: uint8ToBuf(responseArg)
        })
      ).toThrow('The response does not contain the request arguments.');
    });
  });

  describe('assertCallCanisterId', () => {
    it('should not throw an error when canister ID match', () => {
      const requestCanisterId = Principal.fromText(mockCanisterId);
      const responseCanisterId = Principal.fromText(mockCanisterId);

      expect(() => assertCallCanisterId({requestCanisterId, responseCanisterId})).not.toThrow();
    });

    it('should throw an error when methods do not match', () => {
      const requestCanisterId = Principal.fromText(mockCanisterId);
      const responseCanisterId = Principal.fromText(mockPrincipalText);

      expect(() => assertCallCanisterId({requestCanisterId, responseCanisterId})).toThrow(
        'The response canister ID does not match the requested canister ID.'
      );
    });
  });

  describe('assertCallSender', () => {
    const senders = [
      Principal.fromText(mockPrincipalText),
      Principal.fromText(mockPrincipalText).toUint8Array()
    ];

    it.each(senders)('should not throw an error when sender match', (responseSender) => {
      const requestSender = mockPrincipalText;

      expect(() => assertCallSender({requestSender, responseSender})).not.toThrow();
    });

    it.each(senders)('should throw an error when methods do not match', (responseSender) => {
      const requestSender = mockCanisterId;

      expect(() => assertCallSender({requestSender, responseSender})).toThrow(
        'The response sender does not match the request sender.'
      );
    });
  });
});
