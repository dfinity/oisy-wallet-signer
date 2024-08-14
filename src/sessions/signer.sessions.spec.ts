import {Ed25519KeyIdentity} from '@dfinity/identity';
import {afterEach, beforeEach, type MockInstance} from 'vitest';
import {ICRC25_PERMISSION_GRANTED, ICRC27_ACCOUNTS} from '../constants/icrc.constants';
import type {IcrcScopesArray} from '../types/icrc-responses';
import * as storageUtils from '../utils/storage.utils';
import {savePermissions} from './signer.sessions';

describe('Signer sessions', () => {
  describe('savePermissions', () => {
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

    let setSpy: MockInstance;

    beforeEach(() => {
      setSpy = vi.spyOn(storageUtils, 'set');
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should save the permissions to local storage', () => {
      savePermissions({
        owner,
        origin,
        scopes
      });

      const expectedKey = `oisy_signer_${origin}_${owner.toText()}`;
      const expectedValue = {
        scopes,
        createdAt: expect.any(Number)
      };

      expect(setSpy).toHaveBeenCalledWith({key: expectedKey, value: expectedValue});
    });
  });
});
