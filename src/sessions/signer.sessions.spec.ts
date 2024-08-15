import {Ed25519KeyIdentity} from '@dfinity/identity';
import {afterEach, beforeEach, type MockInstance} from 'vitest';
import {ICRC25_PERMISSION_GRANTED, ICRC27_ACCOUNTS} from '../constants/icrc.constants';
import {SIGNER_PERMISSION_VALIDITY_PERIOD_IN_MILLISECONDS} from '../constants/signer.constants';
import type {IcrcScopesArray} from '../types/icrc-responses';
import * as storageUtils from '../utils/storage.utils';
import {del} from '../utils/storage.utils';
import {readValidPermissions, savePermissions} from './signer.sessions';

describe('Signer sessions', () => {
  const owner = Ed25519KeyIdentity.generate().getPrincipal();

  const scopes: IcrcScopesArray = [
    {
      scope: {
        method: ICRC27_ACCOUNTS
      },
      state: ICRC25_PERMISSION_GRANTED
    }
  ];

  const origin = 'https://example.com';

  const expectedKey = `oisy_signer_${origin}_${owner.toText()}`;

  let setSpy: MockInstance;

  beforeEach(() => {
    setSpy = vi.spyOn(storageUtils, 'set');
    vi.useFakeTimers();
  });

  afterEach(() => {
    del({key: expectedKey});

    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should save the permissions to local storage', () => {
    savePermissions({
      owner,
      origin,
      scopes
    });

    const expectedValue = {
      scopes,
      createdAt: expect.any(Number)
    };

    expect(setSpy).toHaveBeenCalledWith({key: expectedKey, value: expectedValue});
  });

  it('should read the permissions from local storage', () => {
    savePermissions({
      owner,
      origin,
      scopes
    });

    const permissions = readValidPermissions({owner, origin});

    const expectedValue = {
      scopes,
      createdAt: expect.any(Number)
    };

    expect(permissions).toEqual(expect.objectContaining(expectedValue));
  });

  it('should return undefined for permissions older than the validity period', () => {
    savePermissions({
      owner,
      origin,
      scopes
    });

    vi.advanceTimersByTime(SIGNER_PERMISSION_VALIDITY_PERIOD_IN_MILLISECONDS + 1);

    const permissions = readValidPermissions({owner, origin});

    expect(permissions).toBeUndefined();
  });

  it('should return the permissions if exactly equals the validity period', () => {
    savePermissions({
      owner,
      origin,
      scopes
    });

    vi.advanceTimersByTime(SIGNER_PERMISSION_VALIDITY_PERIOD_IN_MILLISECONDS);

    const permissions = readValidPermissions({owner, origin});

    expect(permissions).toEqual(
      expect.objectContaining({
        scopes,
        createdAt: expect.any(Number)
      })
    );
  });

  it('should return undefined if permissions are nullish', () => {
    const permissions = readValidPermissions({owner, origin});

    expect(permissions).toBeUndefined();
  });
});
