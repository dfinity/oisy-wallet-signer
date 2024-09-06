import {Actor, type ActorMethod, type ActorSubclass} from '@dfinity/agent';
import type {IDL} from '@dfinity/candid';
import {Principal} from '@dfinity/principal';
import {isNullish} from '@dfinity/utils';
import type {_SERVICE as Icrc21Actor} from '../declarations/icrc-21';
import {idlFactory} from '../declarations/icrc-21.idl';
import type {PrincipalText} from '../types/principal';
import type {SignerOptions} from '../types/signer-options';
import {getAgent} from './agents.api';

let actors: Record<PrincipalText, ActorSubclass<Icrc21Actor>> | undefined | null;

export const getIcrc21Actor = async ({
  canisterId,
  ...rest
}: {
  canisterId: string | Principal;
} & SignerOptions): Promise<Icrc21Actor> => {
  const id = canisterId instanceof Principal ? canisterId.toText() : canisterId;

  const {[id]: icrc21Actor} = actors ?? {[id]: undefined};

  if (isNullish(icrc21Actor)) {
    const actor = await createActor<Icrc21Actor>({
      canisterId,
      idlFactory,
      ...rest
    });

    actors = {
      ...(actors ?? {}),
      [id]: actor
    };

    return actor;
  }

  return icrc21Actor;
};

export const resetActors = (): void => {
  actors = null;
};

const createActor = async <T = Record<string, ActorMethod>>({
  canisterId,
  idlFactory,
  owner,
  host
}: {
  canisterId: string | Principal;
  idlFactory: IDL.InterfaceFactory;
} & SignerOptions): Promise<ActorSubclass<T>> => {
  const agent = await getAgent({owner, host});

  return await Actor.createActor(idlFactory, {
    agent,
    canisterId
  });
};
