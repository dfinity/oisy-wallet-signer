import {Ed25519KeyIdentity} from '@dfinity/identity';
import {mockCanisterId} from '../constants/icrc-accounts.mocks';
import type {
  _SERVICE as Icrc21Actor,
  icrc21_consent_message_request,
  icrc21_consent_message_response
} from '../declarations/icrc-21';
import type {SignerOptions} from '../types/signer-options';
import * as actor from './actors.api';
import {consentMessage} from './canister.api';

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

describe('canister.api', () => {
  const signerOptions: SignerOptions = {
    owner: Ed25519KeyIdentity.generate(),
    host: 'http://localhost:5987'
  };

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

    const icrc21Actor: Omit<Icrc21Actor, 'icrc21_canister_call_consent_message'> = {
      icrc10_supported_standards: vi
        .fn()
        .mockResolvedValue([
          {url: 'http://example.com', name: 'Example'}
        ]) as unknown as Icrc21Actor['icrc10_supported_standards']
    };

    it('should call the consentMessage with correct arguments and return the result', async () => {
      const mockIcrc21Actor: Icrc21Actor = {
        ...icrc21Actor,
        icrc21_canister_call_consent_message: vi
          .fn()
          .mockImplementation(async (_request: icrc21_consent_message_request) => {
            return consentMessageResponse;
          }) as unknown as Icrc21Actor['icrc21_canister_call_consent_message']
      };

      const spy = vi.spyOn(actor, 'getIcrc21Actor');
      spy.mockImplementation(async () => {
        return mockIcrc21Actor;
      });

      const result = await consentMessage({
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

      const mockIcrc21Actor: Icrc21Actor = {
        ...icrc21Actor,
        icrc21_canister_call_consent_message: vi
          .fn()
          .mockImplementation(async (_request: icrc21_consent_message_request) => {
            throw mockError;
          }) as unknown as Icrc21Actor['icrc21_canister_call_consent_message']
      };

      const spy = vi.spyOn(actor, 'getIcrc21Actor');
      spy.mockImplementation(async () => {
        return mockIcrc21Actor;
      });

      await expect(
        consentMessage({
          ...signerOptions,
          canisterId: mockCanisterId,
          request: consentMessageRequest
        })
      ).rejects.toThrow(mockError);
    });
  });
});
