import {Actor, HttpAgent} from '@dfinity/agent';
import {mockCanisterId} from '../constants/icrc-accounts.mocks';
import {idlFactory} from '../declarations/icrc-21.idl';
import {getIcrc21Actor} from './actors.api';

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

describe('getIcrc21Actor', () => {
  const agent = HttpAgent.createSync();

  it('should create a new actor when none exists', async () => {
    const result = await getIcrc21Actor({agent, canisterId: mockCanisterId});

    // TODO: spyOn nor function does work with vitest and Actor.createActor. Not against a better idea than disabling eslint for next line.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(Actor.createActor).toHaveBeenCalledWith(idlFactory, {
      agent,
      canisterId: mockCanisterId
    });

    expect(result).toStrictEqual({test: 123});
  });

  it('should return an existing actor if it is already created', async () => {
    const actor = await getIcrc21Actor({agent, canisterId: mockCanisterId});

    const actorAgain = await getIcrc21Actor({agent, canisterId: mockCanisterId});

    expect(actorAgain).toBe(actor);
  });
});
