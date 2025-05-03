import {RelyingPartyRequestOptionsSchema} from './relying-party-requests';

describe('RelyingPartyRequests', () => {
  describe('Options', () => {
    it('should validate with a specified timeoutInMilliseconds', () => {
      const validData = {
        timeoutInMilliseconds: 3000
      };

      const result = RelyingPartyRequestOptionsSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should validate without specifying timeoutInMilliseconds', () => {
      const validData = {};

      const result = RelyingPartyRequestOptionsSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should fail validation with a non-numeric timeoutInMilliseconds', () => {
      const invalidData = {
        timeoutInMilliseconds: 'three thousand'
      };

      const result = RelyingPartyRequestOptionsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should fail validation with a non-positive timeoutInMilliseconds', () => {
      const invalidData = {
        timeoutInMilliseconds: -500
      };

      const result = RelyingPartyRequestOptionsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should fail validation with a zero timeoutInMilliseconds', () => {
      const invalidData = {
        timeoutInMilliseconds: 0
      };

      const result = RelyingPartyRequestOptionsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });
});
