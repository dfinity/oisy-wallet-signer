import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAgent } from '@dfinity/utils';
import type { SignerOptions } from '../types/signer-options';
import { Ed25519KeyIdentity } from '@dfinity/identity';
import {AgentApi} from "./agent.api";
import type {Agent} from "@dfinity/agent";

vi.mock('@dfinity/utils', async (importOriginal) => {
    const originalModule = await importOriginal<typeof import('@dfinity/utils')>();
    return {
        ...originalModule,
        createAgent: vi.fn(),
    };
});

class TestAgent extends AgentApi {
    async getAgentTest(params: SignerOptions): Promise<Agent> {
        return await this.getAgent(params);
    }
}

describe('AgentApi', () => {
    let agentApi: TestAgent;

    const identity = Ed25519KeyIdentity.generate();

    const signerOptions: SignerOptions = {
        owner: identity,
        host: 'http://localhost:8080',
    };

    beforeEach(() => {
        agentApi = new TestAgent();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('should call createAgent with fetchRootKey for local development (localhost)', async () => {
        await agentApi.getAgentTest(signerOptions);

        expect(createAgent).toHaveBeenCalledWith({
            identity,
            fetchRootKey: true,
            host: 'http://localhost:8080',
        });
    });

    it('should call createAgent without fetchRootKey for non-local host', async () => {
        const nonLocalSignerOptions: SignerOptions = {
            owner: identity,
            host: 'https://icp-api.io',
        };

        await agentApi.getAgentTest(nonLocalSignerOptions);

        expect(createAgent).toHaveBeenCalledWith({
            identity,
            host: 'https://icp-api.io',
        });
    });

    it('should default to the mainnet host if host is undefined', async () => {
        const optionsWithoutHost: SignerOptions = {
            owner: identity,
        };

        await agentApi.getAgentTest(optionsWithoutHost);

        expect(createAgent).toHaveBeenCalledWith({
            identity,
            host: 'https://icp-api.io',
        });
    });

    it('should call createAgent with fetchRootKey for 127.0.0.1', async () => {
        const localSignerOptions: SignerOptions = {
            owner: identity,
            host: 'http://127.0.0.1:8000',
        };

        await agentApi.getAgentTest(localSignerOptions);

        expect(createAgent).toHaveBeenCalledWith({
            identity,
            fetchRootKey: true,
            host: 'http://127.0.0.1:8000',
        });
    });
});
