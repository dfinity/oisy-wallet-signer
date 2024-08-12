import {describe} from 'vitest';
import {ICRC25_PERMISSION_ASK_ON_USE, ICRC27_ACCOUNTS} from '../constants/icrc.constants';
import {RequestPermissionPayloadSchema} from './signer-subscribers';

describe('signer-subscribers', () => {
  describe('RequestPermissionPayloadSchema', () => {
    it('should validate a correct payload', () => {
      const validPayload = {
        requestId: '123',
        scopes: [
          {
            scope: {method: ICRC27_ACCOUNTS},
            state: ICRC25_PERMISSION_ASK_ON_USE
          }
        ]
      };

      const result = RequestPermissionPayloadSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should fail with missing requestId', () => {
      const invalidPayload = {
        scopes: [
          {
            scope: {method: ICRC27_ACCOUNTS},
            state: ICRC25_PERMISSION_ASK_ON_USE
          }
        ]
      };

      const result = RequestPermissionPayloadSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should fail with invalid scopes method', () => {
      const invalidPayload = {
        scopes: [
          {
            scope: {method: 'test'},
            state: ICRC25_PERMISSION_ASK_ON_USE
          }
        ]
      };

      const result = RequestPermissionPayloadSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should fail with invalid scopes state', () => {
      const invalidPayload = {
        scopes: [
          {
            scope: {method: ICRC27_ACCOUNTS},
            state: 'test'
          }
        ]
      };

      const result = RequestPermissionPayloadSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should fail with missing scopes', () => {
      const invalidPayload = {
        requestId: '123'
      };

      const result = RequestPermissionPayloadSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });
});
