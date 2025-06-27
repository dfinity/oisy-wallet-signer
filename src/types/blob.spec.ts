import {uint8ArrayToBase64} from '@dfinity/utils';
import {IcrcBlobSchema} from './blob';

describe('IcrcBlob', () => {
  it('should validate a Uint8Array binary data', () => {
    const validBlob = uint8ArrayToBase64(new Uint8Array([1, 2, 3, 4]));
    const result = IcrcBlobSchema.safeParse(validBlob);

    expect(result.success).toBeTruthy();
  });

  it('should fail validation for a non-Uint8Array object', () => {
    const invalidBlob = [1, 2, 3, 4];
    const result = IcrcBlobSchema.safeParse(invalidBlob);

    expect(result.success).toBeFalsy();

    if (!result.success) {
      expect(result.error.issues).toEqual([
        {
          code: 'invalid_type',
          expected: 'string',
          message: 'Invalid input: expected string, received array',
          path: []
        }
      ]);
    }
  });

  it('should fail validation for a string', () => {
    const invalidBlob = 'string-instead-of-Uint8Array';
    const result = IcrcBlobSchema.safeParse(invalidBlob);

    expect(result.success).toBeFalsy();

    if (!result.success) {
      expect(result.error.issues).toEqual([
        {
          code: 'custom',
          message: 'Invalid base64 string',
          path: []
        }
      ]);
    }
  });

  it('should fail validation for a number', () => {
    const invalidBlob = 1234;
    const result = IcrcBlobSchema.safeParse(invalidBlob);

    expect(result.success).toBeFalsy();

    if (!result.success) {
      expect(result.error.issues).toEqual([
        {
          code: 'invalid_type',
          expected: 'string',
          message: 'Invalid input: expected string, received number',
          path: []
        }
      ]);
    }
  });

  it('should fail validation for an object', () => {
    const invalidBlob = {key: 'value'};
    const result = IcrcBlobSchema.safeParse(invalidBlob);

    expect(result.success).toBeFalsy();

    if (!result.success) {
      expect(result.error.issues).toEqual([
        {
          code: 'invalid_type',
          expected: 'string',
          message: 'Invalid input: expected string, received object',
          path: []
        }
      ]);
    }
  });

  it('should accept empty base64 string', () => {
    const emptyBlob = '';
    const result = IcrcBlobSchema.safeParse(emptyBlob);

    expect(result.success).toBeTruthy();
  });

  it('should fail validation for an incorrectly padded base64 string', () => {
    const invalidBlob = 'YWJjZA'; // Missing padding "=="
    const result = IcrcBlobSchema.safeParse(invalidBlob);

    expect(result.success).toBeFalsy();

    if (!result.success) {
      expect(result.error.issues).toEqual([
        {
          code: 'custom',
          message: 'Invalid base64 string',
          path: []
        }
      ]);
    }
  });
});
