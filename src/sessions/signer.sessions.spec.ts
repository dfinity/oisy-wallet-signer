import {Ed25519KeyIdentity} from '@icp-sdk/core/identity';
import {assertNonNullish} from '@dfinity/utils';
import type {MockInstance} from 'vitest';
import {
  ICRC25_PERMISSION_ASK_ON_USE,
  ICRC25_PERMISSION_DENIED,
  ICRC25_PERMISSION_GRANTED,
  ICRC27_ACCOUNTS,
  ICRC49_CALL_CANISTER
} from '../constants/icrc.constants';
import {SIGNER_PERMISSION_VALIDITY_PERIOD_IN_MILLISECONDS} from '../constants/signer.constants';
import type {IcrcScope, IcrcScopesArray} from '../types/icrc-responses';
import type {IcrcScopedMethod} from '../types/icrc-standards';
import type {SessionPermissions} from '../types/signer-sessions';
import * as storageUtils from '../utils/storage.utils';
import {del, get} from '../utils/storage.utils';
import {readSessionValidScopes, saveSessionScopes, sessionScopeState} from './signer.sessions';

describe('Signer sessions', () => {
  const owner = Ed25519KeyIdentity.generate().getPrincipal();

  const scopeToTest: IcrcScope = {
    scope: {
      method: ICRC27_ACCOUNTS
    },
    state: ICRC25_PERMISSION_GRANTED
  };

  const scopeToRetain: IcrcScope = {
    scope: {
      method: ICRC49_CALL_CANISTER
    },
    state: ICRC25_PERMISSION_GRANTED
  };

  const scopes: IcrcScopesArray = [scopeToTest, scopeToRetain];

  const origin = 'https://example.com';

  const expectedKey = `oisy_signer_${origin}_${owner.toText()}`;

  const expectedScopes = {
    scopes: expect.arrayContaining([
      expect.objectContaining({
        ...scopeToTest,
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
      saveSessionScopes({
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
        saveSessionScopes({
          owner,
          origin,
          scopes
        });

        savedPermissions = get<SessionPermissions>({key: expectedKey});

        updateScopes = [
          {
            ...scopeToTest,
            state: ICRC25_PERMISSION_DENIED
          }
        ];
      });

      it('should retain existing scopes and update new ones', () => {
        assertNonNullish(savedPermissions);

        saveSessionScopes({
          owner,
          origin,
          scopes: updateScopes
        });

        const updatedPermissions = get<SessionPermissions>({key: expectedKey});

        const savedScopeToTest = updatedPermissions?.scopes.find(
          (scope) => scope.scope.method === scopeToTest.scope.method
        );

        assertNonNullish(savedScopeToTest);

        const expectedScopes = {
          scopes: expect.arrayContaining([
            expect.objectContaining({
              ...savedScopeToTest,
              updatedAt: expect.any(Number)
            }),
            {
              ...scopeToRetain,
              createdAt: expect.any(Number),
              updatedAt: expect.any(Number)
            }
          ]),
          createdAt: savedPermissions.createdAt,
          updatedAt: expect.any(Number)
        };

        expect(updatedPermissions).toEqual(expect.objectContaining(expectedScopes));
      });

      it('should not modify any permissions if no scopes is passed - i.e. if we keep the same permissions', () => {
        assertNonNullish(savedPermissions);

        saveSessionScopes({
          owner,
          origin,
          scopes: []
        });

        const updatedPermissions = get<SessionPermissions>({key: expectedKey});

        expect(updatedPermissions).toEqual(savedPermissions);
      });

      it('should update the updatedAt field for existing scopes', () => {
        assertNonNullish(savedPermissions);

        vi.advanceTimersByTime(SIGNER_PERMISSION_VALIDITY_PERIOD_IN_MILLISECONDS);

        saveSessionScopes({
          owner,
          origin,
          scopes: updateScopes
        });

        const updatedPermissions = get<SessionPermissions>({key: expectedKey});

        expect(updatedPermissions?.updatedAt).toBeGreaterThan(savedPermissions.updatedAt);

        const expectedScope = updatedPermissions?.scopes.find(
          (scope) => scope.scope.method === scopeToTest.scope.method
        );

        expect(expectedScope?.updatedAt).toBeGreaterThan(savedPermissions.scopes[0].updatedAt);
      });
    });
  });

  describe('Read', () => {
    it('should read the permissions from local storage', () => {
      saveSessionScopes({
        owner,
        origin,
        scopes
      });

      const permissions = get<SessionPermissions>({key: expectedKey});

      expect(permissions).toEqual(expect.objectContaining(expectedScopes));

      const validScopes = readSessionValidScopes({owner, origin});

      expect(validScopes).toEqual(expect.objectContaining([scopeToTest, scopeToRetain]));
    });

    it('should return undefined if no permissions were ever saved', () => {
      const scopes = readSessionValidScopes({owner, origin});

      expect(scopes).toBeUndefined();
    });

    it('should return empty array for permissions older than the validity period', () => {
      saveSessionScopes({
        owner,
        origin,
        scopes
      });

      vi.advanceTimersByTime(SIGNER_PERMISSION_VALIDITY_PERIOD_IN_MILLISECONDS + 1);

      const sessionScopes = readSessionValidScopes({owner, origin});

      expect(sessionScopes).toHaveLength(0);
    });

    it('should return the permissions if exactly equals the validity period', () => {
      saveSessionScopes({
        owner,
        origin,
        scopes
      });

      vi.advanceTimersByTime(SIGNER_PERMISSION_VALIDITY_PERIOD_IN_MILLISECONDS);

      const permissions = get<SessionPermissions>({key: expectedKey});

      expect(permissions).toEqual(expect.objectContaining(expectedScopes));

      const validScopes = readSessionValidScopes({owner, origin});

      expect(validScopes).toEqual(expect.objectContaining([scopeToTest, scopeToRetain]));
    });

    it('should return undefined if permissions are nullish', () => {
      const scopes = readSessionValidScopes({owner, origin});

      expect(scopes).toBeUndefined();
    });

    it('should use sessionPermissionExpirationInMilliseconds from sessionOptions', () => {
      saveSessionScopes({
        owner,
        origin,
        scopes
      });

      const sessionOptions = {
        sessionPermissionExpirationInMilliseconds: 2 * 24 * 60 * 60 * 1000 // 2 days
      };

      // Now
      const validScopes = readSessionValidScopes({owner, origin, sessionOptions});

      expect(validScopes).toHaveLength(2);

      // 3 days later
      vi.advanceTimersByTime(3 * 24 * 60 * 60 * 1000);

      const emptyScopes = readSessionValidScopes({owner, origin, sessionOptions});

      expect(emptyScopes).toHaveLength(0);
    });
  });

  describe('Session', () => {
    it('should return the state of the session if the scope already exists', () => {
      saveSessionScopes({
        owner,
        origin,
        scopes
      });

      const state = sessionScopeState({
        owner,
        origin,
        method: ICRC27_ACCOUNTS
      });

      expect(state).toBe(ICRC25_PERMISSION_GRANTED);
    });

    it('should return ask on use if the requested method does not exist', () => {
      const state = sessionScopeState({
        owner,
        origin,
        method: 'this_does_not_exist' as IcrcScopedMethod
      });

      expect(state).toBe(ICRC25_PERMISSION_ASK_ON_USE);
    });

    it('should return ask on use if the requested method is not supported', () => {
      const state = sessionScopeState({
        owner,
        origin,
        method: ICRC27_ACCOUNTS
      });

      expect(state).toBe(ICRC25_PERMISSION_ASK_ON_USE);
    });

    it('should return ICRC25_PERMISSION_ASK_ON_USE if there are no valid scopes', () => {
      saveSessionScopes({
        owner,
        origin,
        scopes
      });

      vi.advanceTimersByTime(SIGNER_PERMISSION_VALIDITY_PERIOD_IN_MILLISECONDS + 1);

      const state = sessionScopeState({
        owner,
        origin,
        method: ICRC27_ACCOUNTS
      });

      expect(state).toBe(ICRC25_PERMISSION_ASK_ON_USE);
    });

    it('should call readSessionValidScopes with the correct parameters', () => {
      const readSpy = vi.spyOn(storageUtils, 'get');

      sessionScopeState({
        owner,
        origin,
        method: ICRC27_ACCOUNTS
      });

      expect(readSpy).toHaveBeenCalledWith({
        key: expect.stringContaining(`oisy_signer_${origin}_${owner.toText()}`)
      });
    });
  });
});
