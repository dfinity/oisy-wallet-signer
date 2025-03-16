import {SignerInitOptionsSchema} from './signer-options';

describe('SignerOptions', () => {
  describe('Host', () => {
    it('should validate when host is not provided (optional)', () => {
      const result = SignerInitOptionsSchema.parse({});
      expect(result.host).toBeUndefined();
    });

    it('should validate when a valid host is provided', () => {
      const validSignerOptions = {
        host: 'https://test.com'
      };

      expect(() => SignerInitOptionsSchema.parse(validSignerOptions)).not.toThrow();
    });

    it('should throw an error for an invalid host URL', () => {
      const invalidSignerOptions = {
        host: 'invalid-url'
      };

      expect(() => SignerInitOptionsSchema.parse(invalidSignerOptions)).toThrow('Invalid url');
    });

    it('should validate when localhost is used as host', () => {
      const validSignerOptions = {
        host: 'http://localhost:4987'
      };

      expect(() => SignerInitOptionsSchema.parse(validSignerOptions)).not.toThrow();
    });
  });

  describe('SessionOptions', () => {
    it('should validate when optional sessionOptions is not provided', () => {
      const result = SignerInitOptionsSchema.parse({});
      expect(result.sessionOptions).toBeUndefined();
    });

    it('should validate when valid sessionOptions are provided', () => {
      const validSignerOptions = {
        sessionOptions: {
          sessionPermissionExpirationInMilliseconds: 7 * 24 * 60 * 60 * 1000
        }
      };

      expect(() => SignerInitOptionsSchema.parse(validSignerOptions)).not.toThrow();
    });

    it('should throw an error for invalid sessionPermissionExpirationInMilliseconds (negative)', () => {
      const invalidSignerOptions = {
        sessionOptions: {
          sessionPermissionExpirationInMilliseconds: -1000
        }
      };

      expect(() => SignerInitOptionsSchema.parse(invalidSignerOptions)).toThrow();
    });

    it('should throw an error for invalid sessionPermissionExpirationInMilliseconds (zero)', () => {
      const invalidSignerOptions = {
        sessionOptions: {
          sessionPermissionExpirationInMilliseconds: 0
        }
      };

      expect(() => SignerInitOptionsSchema.parse(invalidSignerOptions)).toThrow();
    });

    it('should throw an error for non-numeric sessionPermissionExpirationInMilliseconds', () => {
      const invalidSignerOptions = {
        sessionOptions: {
          sessionPermissionExpirationInMilliseconds: 'not-a-number'
        }
      };

      expect(() => SignerInitOptionsSchema.parse(invalidSignerOptions)).toThrow();
    });

    it('should validate when sessionPermissionExpirationInMilliseconds is a positive number', () => {
      const validSignerOptions = {
        sessionOptions: {
          sessionPermissionExpirationInMilliseconds: 5000
        }
      };

      expect(() => SignerInitOptionsSchema.parse(validSignerOptions)).not.toThrow();
    });
  });
});
