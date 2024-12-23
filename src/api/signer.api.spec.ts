import * as httpAgent from '@dfinity/agent';
import {Ed25519KeyIdentity} from '@dfinity/identity';
import {IcrcLedgerCanister} from '@dfinity/ledger-icrc';
import {Principal} from '@dfinity/principal';
import {beforeEach, expect} from 'vitest';
import {mockCallCanisterSuccess} from '../mocks/call-canister.mocks';
import {mockRepliedLocalCertificate} from '../mocks/custom-http-agent-responses.mocks';
import {mockRequestDetails, mockRequestPayload} from '../mocks/custom-http-agent.mocks';
import type {SignerOptions} from '../types/signer-options';
import {SignerApi} from './signer.api';

vi.mock('../agent/custom-http-agent', async (importOriginal) => {
  const mockCustomAgent = {
    get agent() {
      return {};
    },

    request: vi.fn(() => ({
      certificate: httpAgent.fromHex(mockRepliedLocalCertificate),
      requestDetails: mockRequestDetails
    }))
  };

  return {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    ...(await importOriginal<typeof import('../agent/custom-http-agent')>()),
    CustomHttpAgent: {
      create: vi.fn().mockResolvedValue(mockCustomAgent)
    }
  };
});

describe('Signer-api', () => {
  const identity = Ed25519KeyIdentity.generate();

  const signerOptions: SignerOptions = {
    owner: identity,
    host: 'http://localhost:8080'
  };

  let signerApi: SignerApi;

  beforeEach(() => {
    signerApi = new SignerApi();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('call', () => {
    it('should call request and return the properly encoded result', async () => {
      const result = await signerApi.call({
        params: {
          ...mockRequestPayload,
          sender: identity.getPrincipal().toText()
        },
        ...signerOptions
      });

      expect(result).toEqual(mockCallCanisterSuccess);
    });
  });

  describe('ledgerMetadata', () => {
    describe('success', () => {
      const mockMetadata = [
        ['icrc1:name', {Text: 'Token'}],
        ['icrc1:symbol', {Text: 'TKN'}],
        ['icrc1:decimals', {Nat: 11n}],
        ['icrc1:fee', {Nat: 12_987n}]
      ];

      const ledgerCanisterMock = {
        metadata: () => Promise.resolve(mockMetadata)
      } as unknown as IcrcLedgerCanister;

      beforeEach(() => {
        vi.spyOn(IcrcLedgerCanister, 'create').mockImplementation(() => ledgerCanisterMock);
      });

      it('should call ledger metadata with a certified call', async () => {
        const spy = vi.spyOn(ledgerCanisterMock, 'metadata');

        await signerApi.ledgerMetadata({
          params: {
            canisterId: mockRequestPayload.canisterId
          },
          ...signerOptions
        });

        expect(spy).toHaveBeenCalledWith({
          certified: true
        });
      });

      it('should init ledger with canister ID', async () => {
        const spy = vi.spyOn(IcrcLedgerCanister, 'create');

        await signerApi.ledgerMetadata({
          params: {
            canisterId: mockRequestPayload.canisterId
          },
          ...signerOptions
        });

        expect(spy).toHaveBeenCalledWith(
          expect.objectContaining({
            canisterId: Principal.fromText(mockRequestPayload.canisterId)
          })
        );
      });

      it('should respond with metadata', async () => {
        const result = await signerApi.ledgerMetadata({
          params: {
            canisterId: mockRequestPayload.canisterId
          },
          ...signerOptions
        });

        expect(result).toEqual(mockMetadata);
      });
    });

    describe('error', () => {
      const mockError = new Error('Test');

      const ledgerCanisterMock = {
        metadata: () => Promise.reject(mockError)
      } as unknown as IcrcLedgerCanister;

      beforeEach(() => {
        vi.spyOn(IcrcLedgerCanister, 'create').mockImplementation(() => ledgerCanisterMock);
      });

      it('should bubble error with metadata', () => {
        expect(
          signerApi.ledgerMetadata({
            params: {
              canisterId: mockRequestPayload.canisterId
            },
            ...signerOptions
          })
        ).rejects.toThrowError(mockError);
      });
    });
  });
});
