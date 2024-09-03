import {Actor, ActorMethod, ActorSubclass, Agent} from '@dfinity/agent';
import type {IDL} from '@dfinity/candid';
import {Principal} from '@dfinity/principal';
import {isNullish} from '@dfinity/utils';
import type {_SERVICE as Icrc21Actor} from '../declarations/icrc-21';
import {idlFactory} from '../declarations/icrc-21.idl';
import {PrincipalText} from '../types/principal';

let actors: Record<PrincipalText, ActorSubclass<Icrc21Actor>> | undefined | null = undefined;

export const getIcrc21Actor = async ({
  agent,
  canisterId
}: {
  agent: Agent;
  canisterId: string | Principal;
}): Promise<Icrc21Actor> => {
  const id = canisterId instanceof Principal ? canisterId.toText() : canisterId;

  const {[id]: icrc21Actor} = actors ?? {[id]: undefined};

  if (isNullish(icrc21Actor)) {
    const actor = await createActor<Icrc21Actor>({
      canisterId,
      idlFactory,
      agent
    });

    actors = {
      ...(actors ?? {}),
      [id]: actor
    };

    return actor;
  }

  return icrc21Actor;
};

const createActor = async <T = Record<string, ActorMethod>>({
  canisterId,
  idlFactory,
  agent
}: {
  canisterId: string | Principal;
  idlFactory: IDL.InterfaceFactory;
  agent: Agent;
}): Promise<ActorSubclass<T>> => {
  return Actor.createActor(idlFactory, {
    agent,
    canisterId
  });
};
