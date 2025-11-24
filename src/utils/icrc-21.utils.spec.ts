import type {Icrc21Did} from '../declarations';
import {mapIcrc21ErrorToString} from './icrc-21.utils';

describe('icrc-21.utils', () => {
  describe('mapIcrc21ErrorToString', () => {
    it('should map GenericError to a string', () => {
      const error: Icrc21Did.icrc21_error = {
        GenericError: {
          description: 'Something went wrong',
          error_code: BigInt(1001)
        }
      };
      const result = mapIcrc21ErrorToString(error);

      expect(result).toBe('Error: Something went wrong (Code: 1001)');
    });

    it('should map InsufficientPayment to a string', () => {
      const error: Icrc21Did.icrc21_error = {
        InsufficientPayment: {
          description: 'Not enough funds'
        }
      };
      const result = mapIcrc21ErrorToString(error);

      expect(result).toBe('Insufficient Payment: Not enough funds');
    });

    it('should map UnsupportedCanisterCall to a string', () => {
      const error: Icrc21Did.icrc21_error = {
        UnsupportedCanisterCall: {
          description: 'Canister call is not supported'
        }
      };
      const result = mapIcrc21ErrorToString(error);

      expect(result).toBe('Unsupported Canister Call: Canister call is not supported');
    });

    it('should map ConsentMessageUnavailable to a string', () => {
      const error: Icrc21Did.icrc21_error = {
        ConsentMessageUnavailable: {
          description: 'Consent message is not available'
        }
      };
      const result = mapIcrc21ErrorToString(error);

      expect(result).toBe('Consent Message Unavailable: Consent message is not available');
    });

    it('should return "Unknown error" for an unrecognized error type', () => {
      const error = {} as unknown as Icrc21Did.icrc21_error;
      const result = mapIcrc21ErrorToString(error);

      expect(result).toBe('Unknown error');
    });
  });
});
