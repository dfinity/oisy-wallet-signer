import {WalletOptionsSchema, WalletRequestOptionsSchema} from './wallet';

describe('Wallet types', () => {
  describe('WalletOptions', () => {
    it('should validate correct wallet options with all fields', () => {
      const validData = {
        url: 'https://example.com',
        windowOptions: {
          position: 'center',
          width: 400,
          height: 300
        },
        connectionOptions: {
          pollingIntervalInMilliseconds: 600,
          timeoutInMilliseconds: 120000
        }
      };

      const result = WalletOptionsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with correct wallet options and string window options', () => {
      const validData = {
        url: 'https://example.com',
        windowOptions: 'width=400,height=300'
      };

      const result = WalletOptionsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail validation with an invalid URL', () => {
      const invalidData = {
        url: 'invalid-url'
      };

      const result = WalletOptionsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail validation with incorrect windowOptions object', () => {
      const invalidData = {
        url: 'https://example.com',
        windowOptions: {
          position: 'bottom-left',
          width: 400,
          height: 300
        }
      };

      const result = WalletOptionsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail validation with incorrect connectionOptions object', () => {
      const invalidData = {
        url: 'https://example.com',
        connectionOptions: {
          pollingIntervalInMilliseconds: '600' // Invalid type
        }
      };

      const result = WalletOptionsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should pass validation with only required fields', () => {
      const validData = {
        url: 'https://example.com'
      };

      const result = WalletOptionsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('WalletRequest', () => {
    it('should validate with a specified timeoutInMilliseconds', () => {
      const validData = {
        timeoutInMilliseconds: 3000
      };

      const result = WalletRequestOptionsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate without specifying timeoutInMilliseconds', () => {
      const validData = {};

      const result = WalletRequestOptionsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail validation with a non-numeric timeoutInMilliseconds', () => {
      const invalidData = {
        timeoutInMilliseconds: 'three thousand'
      };

      const result = WalletRequestOptionsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
