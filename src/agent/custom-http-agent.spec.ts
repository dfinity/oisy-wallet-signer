import {CustomHttpAgent} from "./custom-http-agent";
import {HttpAgent} from "@dfinity/agent";
import {mockCanisterId} from "../mocks/icrc-accounts.mocks";
import {uint8ArrayToBase64} from "../utils/base64.utils";

vi.mock('@dfinity/agent', async (importOriginal) => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    const originalModule = await importOriginal<typeof import('@dfinity/agent')>();

    class MockHttpAgent {
        call = vi.fn().mockResolvedValue({ response: { status: 202 }, requestDetails: {} });
    }

    Object.defineProperty(MockHttpAgent, 'create', {
        value: vi.fn().mockResolvedValue(new MockHttpAgent()),
        writable: true,
    });

    return {
        ...originalModule,
        HttpAgent: MockHttpAgent,
        pollForResponse: vi.fn(),
    };
});

describe('CustomHttpAgent', () => {
    const method = 'test-method';

    it('should create a CustomHttpAgent with the correct options', async () => {
        const agentOptions = {shouldFetchRootKey: true};
        const agent = await CustomHttpAgent.create(agentOptions);
        expect(agent).toBeInstanceOf(CustomHttpAgent);
        expect(agent.agent).toBeInstanceOf(HttpAgent);
    });

    it('should make a valid request and return a valid certificate', async () => {
        const agent = await CustomHttpAgent.create();
        const response = await agent.request({
            arg: uint8ArrayToBase64(new Uint8Array([1, 2, 3, 4])),
            canisterId: mockCanisterId,
            method,
        });

        expect(response).toHaveProperty('certificate');
        expect(response).toHaveProperty('requestDetails');
    });

    it('should throw an error if the arguments are not well formatted', async () => {
        const agent = await CustomHttpAgent.create();
        await expect(agent.request({
            arg: 'base64-encoded-argument',
            canisterId: mockCanisterId,
            method,
        })).rejects.toThrow("Invalid character")
    });
});