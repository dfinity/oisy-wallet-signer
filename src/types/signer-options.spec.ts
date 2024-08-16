import {AnonymousIdentity} from '@dfinity/agent';
import {Ed25519KeyIdentity} from '@dfinity/identity';
import {ICRC25_PERMISSION_GRANTED, ICRC27_ACCOUNTS} from '../constants/icrc.constants';
import {IcrcScopesArray} from './icrc-responses';
import {SignerOptionsSchema} from './signer-options';

describe('SignerOptions', () => {
  const identity = Ed25519KeyIdentity.generate();

  describe('Owner', () => {
    it('should validate a valid owner', () => {
      const validSignerOptions = {
        owner: identity.getPrincipal()
      };

      expect(() => SignerOptionsSchema.parse(validSignerOptions)).not.toThrow();
    });

    it('should throw an error for invalid principal', () => {
      const invalidPrincipal = {id: 'not-a-principal'};

      const invalidSignerOptions = {
        owner: invalidPrincipal
      };

      expect(() => SignerOptionsSchema.parse(invalidSignerOptions)).toThrow(
        'The value provided is not a valid Principal.'
      );
    });

    it('should throw an error for an anonymous Principal', () => {
      const invalidSignerOptions = {
        owner: new AnonymousIdentity().getPrincipal()
      };

      expect(() => SignerOptionsSchema.parse(invalidSignerOptions)).toThrow(
        'The Principal is anonymous and cannot be used.'
      );
    });
  });

  describe('Requests permissions', () => {
    const scopes: IcrcScopesArray = [
      {
        scope: {
          method: ICRC27_ACCOUNTS
        },
        state: ICRC25_PERMISSION_GRANTED
      }
    ];

    it('should validate a valid requestsPermissions function', () => {
      const validSignerOptions = {
        owner: identity.getPrincipal(),
        requestsPermissions: async (_requestedScopes: IcrcScopesArray): Promise<IcrcScopesArray> =>
          scopes
      };

      expect(() => SignerOptionsSchema.parse(validSignerOptions)).not.toThrow();
    });

    it('should throw an error if requestsPermissions is not a function', () => {
      const invalidSignerOptions = {
        owner: identity.getPrincipal(),
        requestsPermissions: 'not-a-function'
      };

      expect(() => SignerOptionsSchema.parse(invalidSignerOptions)).toThrow();
    });

    it('should throw an error if requestsPermissions does not return a promise', () => {
      const identity = Ed25519KeyIdentity.generate();

      const invalidSignerOptions = {
        owner: identity.getPrincipal(),
        requestsPermissions: (_requestedScopes: IcrcScopesArray): IcrcScopesArray => scopes
      };

      expect(() => SignerOptionsSchema.parse(invalidSignerOptions)).toThrow();
    });
  });
});
