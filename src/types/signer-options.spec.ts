import {AnonymousIdentity} from '@dfinity/agent';
import {Ed25519KeyIdentity} from '@dfinity/identity';
import {SignerOptionsSchema} from './signer-options';

describe('SignerOptions', () => {
  it('should validate a valid owner', () => {
    const identity = Ed25519KeyIdentity.generate();

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
