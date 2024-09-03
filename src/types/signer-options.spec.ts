import {AnonymousIdentity, HttpAgent, ProxyAgent} from '@dfinity/agent';
import {Ed25519KeyIdentity} from '@dfinity/identity';
import {describe} from 'vitest';
import {SignerOptionsSchema} from './signer-options';

vi.mock('@dfinity/agent', async (importOriginal) => {
  return {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    ...(await importOriginal<typeof import('@dfinity/agent')>()),
    createSync: vi.fn()
  };
});

describe('SignerOptions', () => {
  describe('Owner', () => {
    const agent = HttpAgent.createSync();

    it('should validate a valid owner', () => {
      const identity = Ed25519KeyIdentity.generate();

      const validSignerOptions = {
        owner: identity.getPrincipal(),
        agent
      };

      expect(() => SignerOptionsSchema.parse(validSignerOptions)).not.toThrow();
    });

    it('should throw an error for invalid principal', () => {
      const invalidPrincipal = {id: 'not-a-principal'};

      const invalidSignerOptions = {
        owner: invalidPrincipal,
        agent
      };

      expect(() => SignerOptionsSchema.parse(invalidSignerOptions)).toThrow(
        'The value provided is not a valid Principal.'
      );
    });

    it('should throw an error for an anonymous Principal', () => {
      const invalidSignerOptions = {
        owner: new AnonymousIdentity().getPrincipal(),
        agent
      };

      expect(() => SignerOptionsSchema.parse(invalidSignerOptions)).toThrow(
        'The Principal is anonymous and cannot be used.'
      );
    });
  });

  describe('Agent', () => {
    const owner = Ed25519KeyIdentity.generate().getPrincipal();

    it('should validate a valid HttpAgent', () => {
      const agent = HttpAgent.createSync();

      const validSignerOptions = {
        owner,
        agent
      };

      expect(() => SignerOptionsSchema.parse(validSignerOptions)).not.toThrow();
    });

    it('should validate a valid ProxyAgent', () => {
      const agent = new ProxyAgent(() => undefined);

      const validSignerOptions = {
        owner,
        agent
      };

      expect(() => SignerOptionsSchema.parse(validSignerOptions)).not.toThrow();
    });

    it('should throw an error for an invalid agent', () => {
      const invalidAgent = {};

      const invalidSignerOptions = {
        owner,
        agent: invalidAgent
      };

      expect(() => SignerOptionsSchema.parse(invalidSignerOptions)).toThrow(
        'Invalid agent instance.'
      );
    });
  });
});
