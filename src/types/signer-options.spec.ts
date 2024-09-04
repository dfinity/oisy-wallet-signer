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
});
