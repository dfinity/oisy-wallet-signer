import * as httpAgent from '@dfinity/agent';
import {Ed25519KeyIdentity} from '@dfinity/identity';
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
