import {Ed25519KeyIdentity} from '@dfinity/identity';
import {assertNonNullish} from '@dfinity/utils';
import type {MockInstance} from 'vitest';
import {
  ICRC25_PERMISSION_DENIED,
  ICRC25_PERMISSION_GRANTED,
  ICRC27_ACCOUNTS
} from '../constants/icrc.constants';
import {SIGNER_PERMISSION_VALIDITY_PERIOD_IN_MILLISECONDS} from '../constants/signer.constants';
import type {IcrcScope, IcrcScopesArray} from '../types/icrc-responses';
import type {SessionPermissions} from '../types/signer-sessions';
import * as storageUtils from '../utils/storage.utils';
import {del} from '../utils/storage.utils';
import {readValidPermissions, savePermissions} from './signer.sessions';

describe('Signer sessions', () => {
  const owner = Ed25519KeyIdentity.generate().getPrincipal();

  const scope: IcrcScope = {
    scope: {
      method: ICRC27_ACCOUNTS
    },
    state: ICRC25_PERMISSION_GRANTED
  };

  const scopes: IcrcScopesArray = [scope];

  const origin = 'https://example.com';

  const expectedKey = `oisy_signer_${origin}_${owner.toText()}`;

  const expectedScopes = {
    scopes: expect.arrayContaining([
      expect.objectContaining({
        ...scope,
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number)
      })
    ]),
    createdAt: expect.any(Number),
    updatedAt: expect.any(Number)
  };

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

  describe('Save', () => {
    it('should save the permissions to local storage', () => {
      savePermissions({
        owner,
        origin,
        scopes
      });

      expect(setSpy).toHaveBeenCalledWith({key: expectedKey, value: expectedScopes});
    });

    describe('Update', () => {
      let savedPermissions: SessionPermissions | undefined;
      let updateScopes: IcrcScopesArray;

      beforeEach(() => {
        savePermissions({
          owner,
          origin,
          scopes
        });

        savedPermissions = readValidPermissions({owner, origin});

        updateScopes = [
          {
            ...scope,
            state: ICRC25_PERMISSION_DENIED
          }
        ];
      });

      it('should retain existing scopes and update new ones', () => {
        assertNonNullish(savedPermissions);

        savePermissions({
          owner,
          origin,
          scopes: updateScopes
        });

        const expectedScopes = {
          scopes: expect.arrayContaining([
            expect.objectContaining({
              ...updateScopes[0],
              createdAt: savedPermissions.scopes[0].createdAt,
              updatedAt: expect.any(Number)
            })
          ]),
          createdAt: savedPermissions.createdAt,
          updatedAt: expect.any(Number)
        };

        const updatedPermissions = readValidPermissions({owner, origin});

        expect(updatedPermissions).toEqual(expect.objectContaining(expectedScopes));
      });

      it('should update the updatedAt field for existing scopes', () => {
        assertNonNullish(savedPermissions);

        vi.advanceTimersByTime(SIGNER_PERMISSION_VALIDITY_PERIOD_IN_MILLISECONDS);

        savePermissions({
          owner,
          origin,
          scopes: updateScopes
        });

        const updatedPermissions = readValidPermissions({owner, origin});

        expect(updatedPermissions?.updatedAt).toBeGreaterThan(savedPermissions.updatedAt);
        expect(updatedPermissions?.scopes[0].updatedAt).toBeGreaterThan(
          savedPermissions.scopes[0].updatedAt
        );
      });
    });
  });

  describe('Read', () => {
    it('should read the permissions from local storage', () => {
      savePermissions({
        owner,
        origin,
        scopes
      });

      const permissions = readValidPermissions({owner, origin});

      expect(permissions).toEqual(expect.objectContaining(expectedScopes));
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

      expect(permissions).toEqual(expectedScopes);
    });

    it('should return undefined if permissions are nullish', () => {
      const permissions = readValidPermissions({owner, origin});

      expect(permissions).toBeUndefined();
    });
  });
});
