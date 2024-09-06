import {Actor} from '@dfinity/agent';
import {Ed25519KeyIdentity} from '@dfinity/identity';
import {Principal} from '@dfinity/principal';
import type {
  _SERVICE as Icrc21Actor,
  icrc21_consent_message_request,
  icrc21_consent_message_response
} from '../declarations/icrc-21';
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

vi.mock('@dfinity/utils', async (importOriginal) => {
  const mockAgent = {test: 456};

  return {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    ...(await importOriginal<typeof import('@dfinity/utils')>()),
    createAgent: vi.fn().mockResolvedValue(mockAgent)
  };
});

describe('icrc-21.canister.api', () => {
  const signerOptions: SignerOptions = {
    owner: Ed25519KeyIdentity.generate(),
    host: 'http://localhost:5987'
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

      vi.spyOn(canister as any, 'getIcrc21Actor').mockResolvedValue({
        icrc21_canister_call_consent_message: vi
          .fn()
          .mockImplementation(async (_request: icrc21_consent_message_request) => {
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
      // TODO: spyOn nor function does work with vitest and Actor.createActor. Not against a better idea than disabling eslint for next line.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(Actor.createActor).toHaveBeenCalledTimes(1);
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
