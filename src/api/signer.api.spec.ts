import {hexStringToUint8Array, uint8ArrayToBase64} from '@dfinity/utils';
import {IcrcLedgerCanister} from '@icp-sdk/canisters/ledger/icrc';
import * as httpAgent from '@icp-sdk/core/agent';
import {Ed25519KeyIdentity} from '@icp-sdk/core/identity';
import {Principal} from '@icp-sdk/core/principal';
import * as customAgent from '../agent/custom-http-agent';
import * as defaultAgent from '../agent/http-agent-provider';
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
        class CustomHttpAgent {
          get agent() {
            return {};
          }

          request = vi.fn(() => ({
            certificate: hexStringToUint8Array(mockRepliedLocalCertificate),
            requestDetails: mockRequestDetails
          }));

          static create = vi.fn().mockResolvedValue(new CustomHttpAgent());
        }

        return {
          CustomHttpAgent
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
      const agent = await customAgent.CustomHttpAgent.create();
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

    it('should return an instance of CustomHttpAgent from getCustomAgent', async () => {
      // @ts-expect-error: accessing protected method for test
      const agent = await signerApi.getCustomAgent({
        ...signerOptions
      });

      expect(agent).toBeInstanceOf(customAgent.CustomHttpAgent);
    });
  });

  describe('ledgerMetadata', () => {
    describe('success', () => {
      const ledgerCanisterMock = {
        metadata: () => Promise.resolve(mockIcrcLedgerMetadata)
      } as unknown as IcrcLedgerCanister;

      beforeEach(() => {
        vi.mock('../agent/http-agent-provider', () => {
          class HttpAgentProvider {
            get agent() {
              return {};
            }

            request = vi.fn(() => ({
              certificate: hexStringToUint8Array(mockRepliedLocalCertificate),
              requestDetails: mockRequestDetails
            }));

            static create = vi.fn().mockResolvedValue(new HttpAgentProvider());
          }

          return {
            HttpAgentProvider
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

      it('should return an instance of HttpAgentProvider from getDefaultAgent', async () => {
        // @ts-expect-error: accessing protected method for test
        const agent = await signerApi.getDefaultAgent({
          ...signerOptions
        });

        expect(agent).toBeInstanceOf(defaultAgent.HttpAgentProvider);
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

      it('should bubble error with metadata', async () => {
        await expect(
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
