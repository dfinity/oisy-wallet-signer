import {AnonymousIdentity} from '@dfinity/agent';
import {Ed25519KeyIdentity} from '@dfinity/identity';
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

      const result = SignerOptionsSchema.safeParse(invalidSignerOptions);

      expect(result.success).toBeFalsy();
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_format',
          format: 'url',
          message: 'Invalid URL',
          path: ['host']
        },
        {
          code: 'custom',
          message: 'Invalid URL.',
          path: ['host']
        }
      ]);
    });

    it('should validate when localhost is used as host', () => {
      const validSignerOptions = {
        owner,
        host: 'http://localhost:4987'
      };

      expect(() => SignerOptionsSchema.parse(validSignerOptions)).not.toThrow();
    });
  });

  describe('SessionOptions', () => {
    const owner = Ed25519KeyIdentity.generate();

    it('should validate when optional sessionOptions is not provided', () => {
      const validSignerOptions = {
        owner
      };

      const result = SignerOptionsSchema.parse(validSignerOptions);

      expect(result.sessionOptions).toBeUndefined();
    });

    it('should validate when valid sessionOptions are provided', () => {
      const validSignerOptions = {
        owner,
        sessionOptions: {
          sessionPermissionExpirationInMilliseconds: 7 * 24 * 60 * 60 * 1000
        }
      };

      expect(() => SignerOptionsSchema.parse(validSignerOptions)).not.toThrow();
    });

    it('should throw an error for invalid sessionPermissionExpirationInMilliseconds (negative)', () => {
      const invalidSignerOptions = {
        owner,
        sessionOptions: {
          sessionPermissionExpirationInMilliseconds: -1000
        }
      };

      expect(() => SignerOptionsSchema.parse(invalidSignerOptions)).toThrow();
    });

    it('should throw an error for invalid sessionPermissionExpirationInMilliseconds (zero)', () => {
      const invalidSignerOptions = {
        owner,
        sessionOptions: {
          sessionPermissionExpirationInMilliseconds: 0
        }
      };

      expect(() => SignerOptionsSchema.parse(invalidSignerOptions)).toThrow();
    });

    it('should throw an error for non-numeric sessionPermissionExpirationInMilliseconds', () => {
      const invalidSignerOptions = {
        owner,
        sessionOptions: {
          sessionPermissionExpirationInMilliseconds: 'not-a-number'
        }
      };

      expect(() => SignerOptionsSchema.parse(invalidSignerOptions)).toThrow();
    });

    it('should validate when sessionPermissionExpirationInMilliseconds is a positive number', () => {
      const validSignerOptions = {
        owner,
        sessionOptions: {
          sessionPermissionExpirationInMilliseconds: 5000
        }
      };

      expect(() => SignerOptionsSchema.parse(validSignerOptions)).not.toThrow();
    });
  });
});
