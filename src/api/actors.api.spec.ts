import {Actor} from '@dfinity/agent';
import {Ed25519KeyIdentity} from '@dfinity/identity';
import {createAgent} from '@dfinity/utils';
import {beforeEach} from 'vitest';
import {mockCanisterId} from '../constants/icrc-accounts.mocks';
import {idlFactory} from '../declarations/icrc-21.idl';
import type {SignerOptions} from '../types/signer-options';
import {getIcrc21Actor, resetActors} from './actors.api';

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

describe('getIcrc21Actor', () => {
  const signerOptions: SignerOptions = {
    owner: Ed25519KeyIdentity.generate(),
    host: 'http://localhost:5987'
  };

  beforeEach(() => {
    resetActors();
    vi.clearAllMocks();
  });

  it('should create a new actor when none exists for local development', async () => {
    const result = await getIcrc21Actor({canisterId: mockCanisterId, ...signerOptions});

    expect(createAgent).toHaveBeenNthCalledWith(1, {
      host: signerOptions.host,
      identity: signerOptions.owner,
      fetchRootKey: true
    });

    // TODO: spyOn nor function does work with vitest and Actor.createActor. Not against a better idea than disabling eslint for next line.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(Actor.createActor).toHaveBeenCalledWith(idlFactory, {
      agent: {test: 456},
      canisterId: mockCanisterId
    });

    expect(result).toStrictEqual({test: 123});
  });

  it('should create a new actor when none exists for mainnet', async () => {
    const result = await getIcrc21Actor({canisterId: mockCanisterId, owner: signerOptions.owner});

    expect(createAgent).toHaveBeenNthCalledWith(1, {
      host: 'https://icp-api.io',
      identity: signerOptions.owner
    });

    // TODO: spyOn nor function does work with vitest and Actor.createActor. Not against a better idea than disabling eslint for next line.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(Actor.createActor).toHaveBeenCalledWith(idlFactory, {
      agent: {test: 456},
      canisterId: mockCanisterId
    });

    expect(result).toStrictEqual({test: 123});
  });

  it('should return an existing actor if it is already created', async () => {
    const actor = await getIcrc21Actor({canisterId: mockCanisterId, ...signerOptions});

    const actorAgain = await getIcrc21Actor({canisterId: mockCanisterId, ...signerOptions});

    expect(actorAgain).toBe(actor);
  });

  it('should clear the cached actors after resetActors is called', async () => {
    await getIcrc21Actor({canisterId: mockCanisterId, ...signerOptions});

    expect(createAgent).toHaveBeenCalledTimes(1);

    resetActors();

    const newActor = await getIcrc21Actor({canisterId: mockCanisterId, ...signerOptions});

    expect(createAgent).toHaveBeenCalledTimes(2);

    expect(newActor).toStrictEqual({test: 123});
  });
});
