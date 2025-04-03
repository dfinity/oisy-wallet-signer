import * as httpAgent from '@dfinity/agent';
import {Ed25519KeyIdentity} from '@dfinity/identity';
import {IcrcLedgerCanister} from '@dfinity/ledger-icrc';
import {Principal} from '@dfinity/principal';
import {uint8ArrayToBase64} from '@dfinity/utils';
import {mockCallCanisterSuccess} from '../mocks/call-canister.mocks';
import {mockRepliedLocalCertificate} from '../mocks/custom-http-agent-responses.mocks';
import {mockRequestDetails, mockRequestPayload} from '../mocks/custom-http-agent.mocks';
import {mockIcrcLedgerMetadata} from '../mocks/icrc-ledger.mocks';
import type {SignerOptions} from '../types/signer-options';
import {SignerApi} from './signer.api';

describe('SignerApi', () => {
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
    beforeEach(() => {
      vi.mock('../agent/custom-http-agent', () => {
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
          CustomHttpAgent: {
            create: vi.fn().mockResolvedValue(mockCustomAgent)
          }
        };
      });
    });

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

    it('should call request with nonce if nonce is provided', async () => {
      const agent = await (await import('../agent/custom-http-agent')).CustomHttpAgent.create();
      const spy = vi.spyOn(agent, 'request');
      const nonce = uint8ArrayToBase64(httpAgent.makeNonce());

      await signerApi.call({
        params: {
          ...mockRequestPayload,
          sender: identity.getPrincipal().toText(),
          nonce
        },
        ...signerOptions
      });

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({nonce}));
    });
  });

  describe('ledgerMetadata', () => {
    describe('success', () => {
      const ledgerCanisterMock = {
        metadata: () => Promise.resolve(mockIcrcLedgerMetadata)
      } as unknown as IcrcLedgerCanister;
      beforeEach(() => {
        vi.mock('../agent/http-agent-provider', () => {
          const mockBasicAgent = {
            get agent() {
              return {};
            },
            request: vi.fn(() => ({
              certificate: httpAgent.fromHex(mockRepliedLocalCertificate),
              requestDetails: mockRequestDetails
            }))
          };

          return {
            HttpAgentProvider: {
              create: vi.fn().mockResolvedValue(mockBasicAgent)
            }
          };
        });

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

        expect(result).toEqual(mockIcrcLedgerMetadata);
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
