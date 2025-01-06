import {Actor} from '@dfinity/agent';
import {Ed25519KeyIdentity} from '@dfinity/identity';
import {Principal} from '@dfinity/principal';
import {CustomHttpAgent} from '../agent/custom-http-agent';
import type {
  _SERVICE as Icrc21Actor,
  icrc21_consent_message_request,
  icrc21_consent_message_response
} from '../declarations/icrc-21';
// eslint-disable-next-line import/no-relative-parent-imports
import {idlFactory} from '../declarations/icrc-21.idl';
import {mockCanisterId} from '../mocks/icrc-accounts.mocks';
import type {SignerOptions} from '../types/signer-options';
import {Icrc21Canister} from './icrc21-canister.api';

vi.mock('@dfinity/agent', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const originalModule = await importOriginal<typeof import('@dfinity/agent')>();

  const mockActor = {test: 123};

  return {
    ...originalModule,
    Actor: {
      ...originalModule.Actor,
      createActor: vi.fn().mockResolvedValue(mockActor)
    },
    createSync: vi.fn()
  };
});

vi.mock('../agent/custom-http-agent', async (importOriginal) => {
  const mockAgent = {test: 456};

  const mockCustomAgent = {
    get agent() {
      return mockAgent;
    }
  };

  return {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    ...(await importOriginal<typeof import('../agent/custom-http-agent')>()),
    CustomHttpAgent: {
      create: vi.fn().mockResolvedValue(mockCustomAgent)
    }
  };
});

describe('icrc-21.canister.api', () => {
  const signerOptions: SignerOptions = {
    owner: Ed25519KeyIdentity.generate(),
    host: 'http://localhost:4943'
  };

  let canister: Icrc21Canister;

  beforeEach(() => {
    canister = new Icrc21Canister();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('consentMessage', () => {
    const consentMessageRequest: icrc21_consent_message_request = {
      method: 'icrc1_transfer',
      arg: new Uint8Array([1, 2, 3]),
      user_preferences: {
        metadata: {
          language: 'en-US',
          utc_offset_minutes: []
        },
        device_spec: [
          {
            GenericDisplay: null
          }
        ]
      }
    };

    const consentMessageResponse: icrc21_consent_message_response = {
      Ok: {
        consent_message: {
          GenericDisplayMessage: 'Transfer 1 ICP to account abcd'
        },
        metadata: {
          language: 'en-US',
          utc_offset_minutes: []
        }
      }
    };

    it('should call the consentMessage with correct arguments and return the result', async () => {
      const mockIcrc21Actor = {
        icrc21_canister_call_consent_message: vi.fn().mockResolvedValue(consentMessageResponse)
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const spy = vi.spyOn(canister as any, 'getIcrc21Actor').mockResolvedValue(mockIcrc21Actor);

      const result = await canister.consentMessage({
        ...signerOptions,
        canisterId: mockCanisterId,
        request: consentMessageRequest
      });

      expect(spy).toHaveBeenCalledWith({
        ...signerOptions,
        canisterId: mockCanisterId
      });

      expect(mockIcrc21Actor.icrc21_canister_call_consent_message).toHaveBeenCalledWith(
        consentMessageRequest
      );

      expect(result).toBe(consentMessageResponse);
    });

    it('should throw an error if the consentMessage throws', async () => {
      const mockError = new Error('Test error');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(canister as any, 'getIcrc21Actor').mockResolvedValue({
        icrc21_canister_call_consent_message: vi
          .fn()
          .mockImplementation(async (_request: icrc21_consent_message_request) => {
            await Promise.resolve();
            throw mockError;
          }) as unknown as Icrc21Actor['icrc21_canister_call_consent_message']
      });

      await expect(
        canister.consentMessage({
          ...signerOptions,
          canisterId: mockCanisterId,
          request: consentMessageRequest
        })
      ).rejects.toThrow(mockError);
    });
  });

  describe('Actors cache', () => {
    it('should create a new actor when none exists ', async () => {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      const result = await canister['getIcrc21Actor']({
        canisterId: mockCanisterId,
        ...signerOptions
      });

      // Assert that the CustomHttpAgent is created and passed to createActor
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(CustomHttpAgent.create).toHaveBeenCalledWith({
        identity: signerOptions.owner,
        host: signerOptions.host,
        shouldFetchRootKey: true
      });

      // TODO: spyOn nor function does work with vitest and Actor.createActor. Not against a better idea than disabling eslint for next line.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(Actor.createActor).toHaveBeenCalledWith(idlFactory, {
        agent: expect.any(Object),
        canisterId: mockCanisterId
      });

      expect(result).toStrictEqual({test: 123});
    });

    it('should return the same actor if called multiple times with the same canisterId', async () => {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      const result = await canister['getIcrc21Actor']({
        canisterId: mockCanisterId,
        ...signerOptions
      });

      // eslint-disable-next-line @typescript-eslint/dot-notation
      const resultAgain = await canister['getIcrc21Actor']({
        canisterId: mockCanisterId,
        ...signerOptions
      });

      expect(resultAgain).toBe(result);

      // Ensure that the `CustomHttpAgent.create` is only called once
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(CustomHttpAgent.create).toHaveBeenCalledOnce();

      // TODO: spyOn nor function does work with vitest and Actor.createActor. Not against a better idea than disabling eslint for next line.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(Actor.createActor).toHaveBeenCalledOnce();
    });

    it('should create a new actor when canisterId changes', async () => {
      const differentCanisterId = Principal.fromText('v7iq7-yiaaa-aaaan-qmrtq-cai');

      // eslint-disable-next-line @typescript-eslint/dot-notation
      await canister['getIcrc21Actor']({
        canisterId: mockCanisterId,
        ...signerOptions
      });

      // eslint-disable-next-line @typescript-eslint/dot-notation
      await canister['getIcrc21Actor']({
        canisterId: differentCanisterId,
        ...signerOptions
      });

      // TODO: spyOn nor function does work with vitest and Actor.createActor. Not against a better idea than disabling eslint for next line.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(Actor.createActor).toHaveBeenCalledTimes(2);
    });
  });
});
