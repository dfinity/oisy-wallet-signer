import {RelyingPartyOptionsSchema} from './relying-party-options';

describe('RelyingPartyOptions', () => {
  it('should validate correct relying party options with all fields', () => {
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

    const result = RelyingPartyOptionsSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should validate with correct relying party options and string window options', () => {
    const validData = {
      url: 'https://example.com',
      windowOptions: 'width=400,height=300'
    };

    const result = RelyingPartyOptionsSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should fail validation with an invalid URL', () => {
    const invalidData = {
      url: 'invalid-url'
    };

    const result = RelyingPartyOptionsSchema.safeParse(invalidData);
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

    const result = RelyingPartyOptionsSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should fail validation with incorrect connectionOptions object', () => {
    const invalidData = {
      url: 'https://example.com',
      connectionOptions: {
        pollingIntervalInMilliseconds: '600' // Invalid type
      }
    };

    const result = RelyingPartyOptionsSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should pass validation with only required fields', () => {
    const validData = {
      url: 'https://example.com'
    };

    const result = RelyingPartyOptionsSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should validate with the optional onDisconnect callback', () => {
    const validData = {
      url: 'https://example.com',
      onDisconnect: () => {
        // Do nothing
      }
    };

    const result = RelyingPartyOptionsSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should fail validation if onDisconnect is not a function', () => {
    const invalidData = {
      url: 'https://example.com',
      onDisconnect: 'not-a-function' // Invalid type for onDisconnect
    };

    const result = RelyingPartyOptionsSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
