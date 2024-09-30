import {uint8ArrayToBase64} from '../utils/base64.utils';
import {IcrcBlobSchema} from './blob';

describe('IcrcBlob', () => {
  it('should validate a Uint8Array binary data', () => {
    const validBlob = uint8ArrayToBase64(new Uint8Array([1, 2, 3, 4]));
    const result = IcrcBlobSchema.safeParse(validBlob);
    expect(result.success).toBe(true);
  });

  it('should fail validation for a non-Uint8Array object', () => {
    const invalidBlob = [1, 2, 3, 4];
    const result = IcrcBlobSchema.safeParse(invalidBlob);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Expected string, received array');
    }
  });

  it('should fail validation for a string', () => {
    const invalidBlob = 'string-instead-of-Uint8Array';
    const result = IcrcBlobSchema.safeParse(invalidBlob);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Invalid base64 string');
    }
  });

  it('should fail validation for a number', () => {
    const invalidBlob = 1234;
    const result = IcrcBlobSchema.safeParse(invalidBlob);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Expected string, received number');
    }
  });

  it('should fail validation for an object', () => {
    const invalidBlob = {key: 'value'};
    const result = IcrcBlobSchema.safeParse(invalidBlob);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Expected string, received object');
    }
  });

  it('should accept empty base64 string', () => {
    const emptyBlob = '';
    const result = IcrcBlobSchema.safeParse(emptyBlob);
    expect(result.success).toBe(true);
  });

  it('should fail validation for an incorrectly padded base64 string', () => {
    const invalidBlob = 'YWJjZA'; // Missing padding "=="
    const result = IcrcBlobSchema.safeParse(invalidBlob);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Invalid base64 string');
    }
  });
});
