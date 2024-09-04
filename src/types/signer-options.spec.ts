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

  describe('Mode', () => {
    const owner = Ed25519KeyIdentity.generate();

    it('should validate when mode is production (default)', () => {
      const validSignerOptions = {
        owner
      };

      const result = SignerOptionsSchema.parse(validSignerOptions);
      expect(result.mode).toBe('production');
    });

    it('should validate when mode is explicitly production', () => {
      const validSignerOptions = {
        owner,
        mode: 'production'
      };

      expect(() => SignerOptionsSchema.parse(validSignerOptions)).not.toThrow();
    });

    it('should validate when mode is development', () => {
      const validSignerOptions = {
        owner,
        mode: 'development'
      };

      expect(() => SignerOptionsSchema.parse(validSignerOptions)).not.toThrow();
    });

    it('should throw an error for an invalid mode value', () => {
      const invalidSignerOptions = {
        owner,
        mode: 'invalid-mode'
      };

      expect(() => SignerOptionsSchema.parse(invalidSignerOptions)).toThrow();
    });
  });
});
