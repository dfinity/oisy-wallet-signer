import {Expiry} from '@dfinity/agent';
import {Principal} from '@dfinity/principal';
import {mockPrincipalText} from '../mocks/icrc-accounts.mocks';
import {contentMapReplacer} from './cbor.utils';

describe('cbor.utils', () => {
  describe('contentMapReplacer', () => {
    it('replaces ingress_expiry with bigint from Expiry', () => {
      const expiry = new Expiry(5 * 60 * 1000);
      const result = contentMapReplacer(expiry, 'ingress_expiry');

      expect(result instanceof Expiry).toBeFalsy();
      expect(result).toBe((expiry as unknown as {_value: bigint})._value);
    });

    it('replaces sender key with Uint8Array if valid Principal', () => {
      const principal = Principal.fromText(mockPrincipalText);
      const result = contentMapReplacer(principal, 'sender');

      expect(result).toBeInstanceOf(Uint8Array);
      expect(principal.toText()).toBe(Principal.fromUint8Array(result as Uint8Array).toText());
    });

    it('replaces canister_id key with Uint8Array if valid Principal', () => {
      const principal = Principal.fromText(mockPrincipalText);
      const result = contentMapReplacer(principal, 'canister_id');

      expect(result).toBeInstanceOf(Uint8Array);
      expect(principal.toText()).toBe(Principal.fromUint8Array(result as Uint8Array).toText());
    });

    it('returns original value for unrelated keys', () => {
      const value = 'some value';
      const result = contentMapReplacer(value, 'other_key');

      expect(result).toBe(value);
    });

    it('returns original value if sender/canister_id value is not a Principal', () => {
      const value = 'not a principal';
      const result = contentMapReplacer(value, 'sender');

      expect(result).toBe(value);
    });

    it('returns undefined if no value provided', () => {
      const result = contentMapReplacer(undefined, 'sender');

      expect(result).toBe(undefined);
    });

    it('returns original value if undefined key', () => {
      const value = 'a value';
      const result = contentMapReplacer(value, undefined);

      expect(result).toBe(value);
    });

    it('returns original Principal if undefined key', () => {
      const principal = Principal.fromText(mockPrincipalText);
      const result = contentMapReplacer(principal, undefined);

      expect(result instanceof Principal).toBeTruthy();
      expect((result as Principal).toText()).toBe(principal.toText());
    });

    it('returns original Principal if misspelled sender key', () => {
      const principal = Principal.fromText(mockPrincipalText);
      const result = contentMapReplacer(principal, 'sendder');

      expect(result instanceof Principal).toBeTruthy();
      expect((result as Principal).toText()).toBe(principal.toText());
    });

    it('returns original Principal if misspelled canister_id key', () => {
      const principal = Principal.fromText(mockPrincipalText);
      const result = contentMapReplacer(principal, 'canister_idd');

      expect(result instanceof Principal).toBeTruthy();
      expect((result as Principal).toText()).toBe(principal.toText());
    });

    it('returns original Expiry if undefined key', () => {
      const expiry = new Expiry(5 * 60 * 1000);
      const result = contentMapReplacer(expiry, undefined);

      expect(result instanceof Expiry).toBeTruthy();
      expect((result as unknown as {_value: bigint})._value).toBe(
        (expiry as unknown as {_value: bigint})._value
      );
    });

    it('returns original Expiry if misspelled ingress_expiry key', () => {
      const expiry = new Expiry(5 * 60 * 1000);
      const result = contentMapReplacer(expiry, 'ingress_expiryy');

      expect(result instanceof Expiry).toBeTruthy();
      expect((result as unknown as {_value: bigint})._value).toBe(
        (expiry as unknown as {_value: bigint})._value
      );
    });
  });
});
