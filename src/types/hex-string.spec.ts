import {HexStringSchema} from './hex-string';

describe('HexStringSchema', () => {
  it('should validate correct lowercase hex strings', () => {
    const validHex = 'abcdef1234567890';

    expect(HexStringSchema.safeParse(validHex).success).toBeTruthy();
  });

  it('should validate correct uppercase hex strings', () => {
    const validHexUpper = 'ABCDEF1234567890';

    expect(HexStringSchema.safeParse(validHexUpper).success).toBeTruthy();
  });

  it('should validate mixed-case hex strings', () => {
    const mixedHex = 'AbCdEf123456';

    expect(HexStringSchema.safeParse(mixedHex).success).toBeTruthy();
  });

  it('should invalidate strings containing non-hex characters', () => {
    const invalidHex = 'xyz123';
    const result = HexStringSchema.safeParse(invalidHex);

    expect(result.success).toBeFalsy();
  });

  it('should invalidate empty strings', () => {
    const emptyString = '';
    const result = HexStringSchema.safeParse(emptyString);

    expect(result.success).toBeFalsy();
  });

  it('should invalidate strings with special characters', () => {
    const invalidSpecial = '1234-abcd';
    const result = HexStringSchema.safeParse(invalidSpecial);

    expect(result.success).toBeFalsy();
  });

  it('should invalidate strings containing spaces', () => {
    const invalidSpaces = 'abc 123';
    const result = HexStringSchema.safeParse(invalidSpaces);

    expect(result.success).toBeFalsy();
  });
});
