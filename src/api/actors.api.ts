import {Actor, type ActorMethod, type ActorSubclass, type Agent, Identity} from '@dfinity/agent';
import type {IDL} from '@dfinity/candid';
import {Principal} from '@dfinity/principal';
import {createAgent, isNullish} from '@dfinity/utils';
import type {_SERVICE as Icrc21Actor} from '../declarations/icrc-21';
import {idlFactory} from '../declarations/icrc-21.idl';
import type {PrincipalText} from '../types/principal';

let actors: Record<PrincipalText, ActorSubclass<Icrc21Actor>> | undefined | null;

export const getIcrc21Actor = async ({
  identity,
  canisterId
}: {
  identity: Identity
  canisterId: string | Principal;
}): Promise<Icrc21Actor> => {
  const id = canisterId instanceof Principal ? canisterId.toText() : canisterId;

  const {[id]: icrc21Actor} = actors ?? {[id]: undefined};

  if (isNullish(icrc21Actor)) {
    const actor = await createActor<Icrc21Actor>({
      canisterId,
      idlFactory,
      identity
    });

    actors = {
      ...(actors ?? {}),
      [id]: actor
    };

    return actor;
  }

  return icrc21Actor;
};

export const resetActors = () => {
  actors = null;
}

const createActor = async <T = Record<string, ActorMethod>>({
  canisterId,
  idlFactory,
  identity
}: {
  canisterId: string | Principal;
  idlFactory: IDL.InterfaceFactory;
  identity: Identity;
}): Promise<ActorSubclass<T>> => {
  const agent = await createAgent({
    identity,
    fetchRootKey: LOCAL,
    host: LOCAL ? 'http://localhost:4943/' : 'https://icp-api.io',
  });

  return await Actor.createActor(idlFactory, {
    agent,
    canisterId
  });
};
