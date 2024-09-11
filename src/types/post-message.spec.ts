import {OriginSchema} from './post-message';

describe('post-message', () => {
  it('should validate a correct origin', () => {
    const validUrl = 'https://test.com';
    const result = OriginSchema.safeParse(validUrl);
    expect(result.success).toBe(true);
  });

  it('should invalidate an incorrect origin', () => {
    const invalidUrl = 'invalid-origin';
    const result = OriginSchema.safeParse(invalidUrl);
    expect(result.success).toBe(false);
  });

  it('should invalidate an empty origin string', () => {
    const emptyUrl = '';
    const result = OriginSchema.safeParse(emptyUrl);
    expect(result.success).toBe(false);
  });

  it('should invalidate a non-string origin', () => {
    const nonStringValue = 12345;
    const result = OriginSchema.safeParse(nonStringValue);
    expect(result.success).toBe(false);
  });
});
