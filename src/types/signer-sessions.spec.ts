import {ICRC25_PERMISSION_GRANTED, ICRC27_ACCOUNTS} from '../constants/icrc.constants';
import type {IcrcScopesArray} from './icrc-responses';
import {SessionPermissionsSchema} from './signer-sessions';

describe('Signer-sessions', () => {
  const scopes: IcrcScopesArray = [
    {
      scope: {
        method: ICRC27_ACCOUNTS
      },
      state: ICRC25_PERMISSION_GRANTED
    }
  ];

  it('should validate a correct SessionPermissions object', () => {
    const validData = {
      scopes,
      createdAt: Date.now()
    };

    const parsedData = SessionPermissionsSchema.parse(validData);
    expect(parsedData).toEqual(validData);
  });

  it('should fail validation if createdAt is not a number', () => {
    const invalidData = {
      scopes,
      createdAt: 'not-a-number'
    };

    expect(() => SessionPermissionsSchema.parse(invalidData)).toThrow();
  });

  it('should fail validation if createdAt is missing', () => {
    const invalidData = {
      scopes
    };

    expect(() => SessionPermissionsSchema.parse(invalidData)).toThrow();
  });

  it('should fail validation if scopes is missing', () => {
    const invalidData = {
      createdAt: Date.now()
    };

    expect(() => SessionPermissionsSchema.parse(invalidData)).toThrow();
  });
});
