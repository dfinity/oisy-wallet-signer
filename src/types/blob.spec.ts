import {IcrcBlob} from './blob';

describe('IcrcBlob', () => {
  it('should validate a Uint8Array', () => {
    const validBlob = new Uint8Array([1, 2, 3, 4]);
    const result = IcrcBlob.safeParse(validBlob);
    expect(result.success).toBe(true);
  });

  it('should fail validation for a non-Uint8Array object', () => {
    const invalidBlob = [1, 2, 3, 4];
    const result = IcrcBlob.safeParse(invalidBlob);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Input not instance of Uint8Array');
    }
  });

  it('should fail validation for a string', () => {
    const invalidBlob = 'string-instead-of-Uint8Array';
    const result = IcrcBlob.safeParse(invalidBlob);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Input not instance of Uint8Array');
    }
  });

  it('should fail validation for a number', () => {
    const invalidBlob = 1234;
    const result = IcrcBlob.safeParse(invalidBlob);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Input not instance of Uint8Array');
    }
  });

  it('should fail validation for an object', () => {
    const invalidBlob = {key: 'value'};
    const result = IcrcBlob.safeParse(invalidBlob);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Input not instance of Uint8Array');
    }
  });
});
