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

    expect(result.success).toBeTruthy();
  });

  it('should fail validation with a negative pollingIntervalInMilliseconds', () => {
    const invalidData = {
      url: 'https://example.com',
      connectionOptions: {
        pollingIntervalInMilliseconds: -500
      }
    };

    const result = RelyingPartyOptionsSchema.safeParse(invalidData);

    expect(result.success).toBeFalsy();
  });

  it('should fail validation with zero pollingIntervalInMilliseconds', () => {
    const invalidData = {
      url: 'https://example.com',
      connectionOptions: {
        pollingIntervalInMilliseconds: 0
      }
    };

    const result = RelyingPartyOptionsSchema.safeParse(invalidData);

    expect(result.success).toBeFalsy();
  });

  it('should fail validation with a zero timeoutInMilliseconds', () => {
    const invalidData = {
      url: 'https://example.com',
      connectionOptions: {
        timeoutInMilliseconds: 0
      }
    };

    const result = RelyingPartyOptionsSchema.safeParse(invalidData);

    expect(result.success).toBeFalsy();
  });

  it('should fail validation with a negative timeoutInMilliseconds', () => {
    const invalidData = {
      url: 'https://example.com',
      connectionOptions: {
        timeoutInMilliseconds: -120000
      }
    };

    const result = RelyingPartyOptionsSchema.safeParse(invalidData);

    expect(result.success).toBeFalsy();
  });

  it('should validate with correct relying party options and string window options', () => {
    const validData = {
      url: 'https://example.com',
      windowOptions: 'width=400,height=300'
    };

    const result = RelyingPartyOptionsSchema.safeParse(validData);

    expect(result.success).toBeTruthy();
  });

  it('should fail validation with an invalid URL', () => {
    const invalidData = {
      url: 'invalid-url'
    };

    const result = RelyingPartyOptionsSchema.safeParse(invalidData);

    expect(result.success).toBeFalsy();
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

    expect(result.success).toBeFalsy();
  });

  it('should fail validation with zero width for the signer window', () => {
    const invalidData = {
      url: 'https://example.com',
      windowOptions: {
        position: 'center',
        width: 0,
        height: 300
      }
    };

    const result = RelyingPartyOptionsSchema.safeParse(invalidData);

    expect(result.success).toBeFalsy();
  });

  it('should fail validation with zero height for the signer window', () => {
    const invalidData = {
      url: 'https://example.com',
      windowOptions: {
        position: 'center',
        width: 400,
        height: 0
      }
    };

    const result = RelyingPartyOptionsSchema.safeParse(invalidData);

    expect(result.success).toBeFalsy();
  });

  it('should pass validation with positive width and height for the signer window', () => {
    const validData = {
      url: 'https://example.com',
      windowOptions: {
        position: 'center',
        width: 400,
        height: 300
      }
    };

    const result = RelyingPartyOptionsSchema.safeParse(validData);

    expect(result.success).toBeTruthy();
  });

  it('should fail validation with incorrect connectionOptions object', () => {
    const invalidData = {
      url: 'https://example.com',
      connectionOptions: {
        pollingIntervalInMilliseconds: '600' // Invalid type
      }
    };

    const result = RelyingPartyOptionsSchema.safeParse(invalidData);

    expect(result.success).toBeFalsy();
  });

  it('should pass validation with only required fields', () => {
    const validData = {
      url: 'https://example.com'
    };

    const result = RelyingPartyOptionsSchema.safeParse(validData);

    expect(result.success).toBeTruthy();
  });

  it('should validate with the optional onDisconnect callback', () => {
    const validData = {
      url: 'https://example.com',
      onDisconnect: () => {
        // Do nothing
      }
    };

    const result = RelyingPartyOptionsSchema.safeParse(validData);

    expect(result.success).toBeTruthy();
  });

  it('should fail validation if onDisconnect is not a function', () => {
    const invalidData = {
      url: 'https://example.com',
      onDisconnect: 'not-a-function' // Invalid type for onDisconnect
    };

    const result = RelyingPartyOptionsSchema.safeParse(invalidData)

    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_type',
        "expected": "function",
        path: ['onDisconnect'],
        message: 'Invalid input: expected function, received string'
      }
    ]);
  });

  describe('host', () => {
    const validData = {
      url: 'https://example.com'
    };

    it('should validate with a valid localhost URL (http)', () => {
      const result = RelyingPartyOptionsSchema.safeParse({
        ...validData,
        host: 'http://localhost:4943'
      });

      expect(result.success).toBeTruthy();
    });

    it('should validate with a valid localhost URL (https)', () => {
      const result = RelyingPartyOptionsSchema.safeParse({
        ...validData,
        host: 'https://localhost:4943'
      });

      expect(result.success).toBeTruthy();
    });

    it('should validate with a valid https URL', () => {
      const result = RelyingPartyOptionsSchema.safeParse({
        ...validData,
        host: 'https://example.com'
      });

      expect(result.success).toBeTruthy();
    });

    it('should invalidate with an http URL for non-localhost', () => {
      const result = RelyingPartyOptionsSchema.safeParse({
        ...validData,
        host: 'http://example.com'
      });

      expect(result.success).toBeFalsy();
      expect(result.error?.issues).toEqual([
        {
          code: 'custom',
          message: 'Invalid URL.',
          path: ['host']
        }
      ]);
    });

    it('should validate without host (host optional)', () => {
      const result = RelyingPartyOptionsSchema.safeParse({
        ...validData
      });

      expect(result.success).toBeTruthy();
    });

    it('should invalidate with an incorrect URL format', () => {
      const result = RelyingPartyOptionsSchema.safeParse({
        ...validData,
        host: 'not-a-url'
      });

      expect(result.success).toBeFalsy();
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_format',
          format: 'url',
          message: 'Invalid URL',
          path: ['host']
        },
        {
          code: 'custom',
          message: 'Invalid URL.',
          path: ['host']
        }
      ]);
    });
  });
});
