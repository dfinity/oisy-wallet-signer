import {describe, expect, it} from 'vitest';
import {RelyingPartyWalletOptionsSchema} from './relying-party-wallet-options';

describe('RelyingPartyWalletOptionsSchema', () => {
  const validData = {
    url: 'https://example.com'
  };

  it('should validate with a valid localhost URL (http)', () => {
    const result = RelyingPartyWalletOptionsSchema.safeParse({
      ...validData,
      host: 'http://localhost:4943'
    });
    expect(result.success).toBe(true);
  });

  it('should validate with a valid localhost URL (https)', () => {
    const result = RelyingPartyWalletOptionsSchema.safeParse({
      ...validData,
      host: 'https://localhost:4943'
    });
    expect(result.success).toBe(true);
  });

  it('should validate with a valid https URL', () => {
    const result = RelyingPartyWalletOptionsSchema.safeParse({
      ...validData,
      host: 'https://example.com'
    });
    expect(result.success).toBe(true);
  });

  it('should invalidate with an http URL for non-localhost', () => {
    const result = RelyingPartyWalletOptionsSchema.safeParse({
      ...validData,
      host: 'http://example.com'
    });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0]?.message).toBe('Invalid URL.');
  });

  it('should validate without host (host optional)', () => {
    const result = RelyingPartyWalletOptionsSchema.safeParse({
      ...validData
    });
    expect(result.success).toBe(true);
  });

  it('should invalidate with an incorrect URL format', () => {
    const result = RelyingPartyWalletOptionsSchema.safeParse({
      ...validData,
      host: 'not-a-url'
    });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0]?.message).toBe('Invalid url');
  });
});
