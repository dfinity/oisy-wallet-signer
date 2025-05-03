import {ICRC25_PERMISSION_GRANTED, ICRC27_ACCOUNTS} from '../constants/icrc.constants';
import type {IcrcScope} from './icrc-responses';
import {SessionPermissionsSchema} from './signer-sessions';

describe('Signer-sessions', () => {
  const scope: IcrcScope = {
    scope: {
      method: ICRC27_ACCOUNTS
    },
    state: ICRC25_PERMISSION_GRANTED
  };

  const scopeWithTimestamps = {
    ...scope,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const scopes = [scopeWithTimestamps];

  it('should validate a correct SessionPermissions', () => {
    const validData = {
      scopes,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const parsedData = SessionPermissionsSchema.parse(validData);

    expect(parsedData).toEqual(validData);
  });

  it('should fail validation if createdAt is not a number', () => {
    const invalidData = {
      scopes,
      createdAt: 'not-a-number',
      updatedAt: Date.now()
    };

    expect(() => SessionPermissionsSchema.parse(invalidData)).toThrow();
  });

  it('should fail validation if createdAt is missing', () => {
    const invalidData = {
      scopes,
      updatedAt: Date.now()
    };

    expect(() => SessionPermissionsSchema.parse(invalidData)).toThrow();
  });

  it('should fail validation with a negative createdAt', () => {
    const invalidData = {
      scopes,
      createdAt: -1000,
      updatedAt: Date.now()
    };

    expect(() => SessionPermissionsSchema.parse(invalidData)).toThrow();
  });

  it('should fail validation with a zero createdAt', () => {
    const invalidData = {
      scopes,
      createdAt: 0,
      updatedAt: Date.now()
    };

    expect(() => SessionPermissionsSchema.parse(invalidData)).toThrow();
  });

  it('should fail validation if updatedAt is not a number', () => {
    const invalidData = {
      scopes,
      createdAt: Date.now(),
      updatedAt: 'not-a-number'
    };

    expect(() => SessionPermissionsSchema.parse(invalidData)).toThrow();
  });

  it('should fail validation if updatedAt is missing', () => {
    const invalidData = {
      scopes,
      created: Date.now()
    };

    expect(() => SessionPermissionsSchema.parse(invalidData)).toThrow();
  });

  it('should fail validation with a negative updatedAt', () => {
    const invalidData = {
      scopes,
      createdAt: Date.now(),
      updatedAt: -1000
    };

    expect(() => SessionPermissionsSchema.parse(invalidData)).toThrow();
  });

  it('should fail validation with a zero updatedAt', () => {
    const invalidData = {
      scopes,
      createdAt: Date.now(),
      updatedAt: 0
    };

    expect(() => SessionPermissionsSchema.parse(invalidData)).toThrow();
  });

  it('should fail validation if scopes is missing', () => {
    const invalidData = {
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    expect(() => SessionPermissionsSchema.parse(invalidData)).toThrow();
  });

  it('should fail validation if createdAt is not a number in a scope', () => {
    const invalidData = {
      scopes: [
        {
          ...scope,
          createdAt: 'not-a-number',
          updatedAt: Date.now()
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    expect(() => SessionPermissionsSchema.parse(invalidData)).toThrow();
  });

  it('should fail validation if createdAt is missing in a scope', () => {
    const invalidData = {
      scopes: [
        {
          ...scope,
          updatedAt: Date.now()
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    expect(() => SessionPermissionsSchema.parse(invalidData)).toThrow();
  });

  it('should fail validation if updatedAt is not a number in a scope', () => {
    const invalidData = {
      scopes: [
        {
          ...scope,
          createdAt: Date.now(),
          updatedAt: 'not-a-number'
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    expect(() => SessionPermissionsSchema.parse(invalidData)).toThrow();
  });

  it('should fail validation if updatedAt is missing in a scope', () => {
    const invalidData = {
      scopes: [
        {
          ...scope,
          createdAt: Date.now()
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    expect(() => SessionPermissionsSchema.parse(invalidData)).toThrow();
  });

  it('should pass validate if scopes array is empty', () => {
    const invalidData = {
      scopes: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    expect(() => SessionPermissionsSchema.parse(invalidData)).not.toThrow();
  });

  it('should validate a correct SessionPermissions object with multiple scopes', () => {
    const validData = {
      scopes: [
        scopeWithTimestamps,
        {
          ...scope,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const parsedData = SessionPermissionsSchema.parse(validData);

    expect(parsedData).toEqual(validData);
  });
});
