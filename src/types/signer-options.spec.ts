import {AnonymousIdentity} from '@dfinity/agent';
import {Ed25519KeyIdentity} from '@dfinity/identity';
import {describe} from 'vitest';
import {SignerOptionsSchema} from './signer-options';

describe('SignerOptions', () => {
  describe('Owner', () => {
    it('should validate a valid owner', () => {
      const identity = Ed25519KeyIdentity.generate();

      const validSignerOptions = {
        owner: identity
      };

      expect(() => SignerOptionsSchema.parse(validSignerOptions)).not.toThrow();
    });

    it('should throw an error for invalid identity', () => {
      const invalidIdentity = {id: 'not-an-identity'};

      const invalidSignerOptions = {
        owner: invalidIdentity
      };

      expect(() => SignerOptionsSchema.parse(invalidSignerOptions)).toThrow(
        'The value provided is not a valid Identity.'
      );
    });

    it('should throw an error for invalid principal', () => {
      const invalidIdentity = {_principal: {id: 'not-a-principal'}};

      const invalidSignerOptions = {
        owner: invalidIdentity
      };

      expect(() => SignerOptionsSchema.parse(invalidSignerOptions)).toThrow(
        'The value provided is not a valid Identity.'
      );
    });

    it('should throw an error for an anonymous Principal', () => {
      const invalidSignerOptions = {
        owner: new AnonymousIdentity()
      };

      expect(() => SignerOptionsSchema.parse(invalidSignerOptions)).toThrow(
        'The Principal is anonymous and cannot be used.'
      );
    });
  });

  describe('Host', () => {
    const owner = Ed25519KeyIdentity.generate();

    it('should validate when host is not provided (optional)', () => {
      const validSignerOptions = {
        owner
      };

      const result = SignerOptionsSchema.parse(validSignerOptions);
      expect(result.host).toBeUndefined();
    });

    it('should validate when a valid host is provided', () => {
      const validSignerOptions = {
        owner,
        host: 'https://test.com'
      };

      expect(() => SignerOptionsSchema.parse(validSignerOptions)).not.toThrow();
    });

    it('should throw an error for an invalid host URL', () => {
      const invalidSignerOptions = {
        owner,
        host: 'invalid-url'
      };

      expect(() => SignerOptionsSchema.parse(invalidSignerOptions)).toThrow('Invalid url');
    });

    it('should validate when localhost is used as host', () => {
      const validSignerOptions = {
        owner,
        host: 'http://localhost:4987'
      };

      expect(() => SignerOptionsSchema.parse(validSignerOptions)).not.toThrow();
    });
  });
});
