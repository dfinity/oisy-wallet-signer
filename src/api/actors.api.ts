import {Actor, type ActorMethod, type ActorSubclass} from '@dfinity/agent';
import type {IDL} from '@dfinity/candid';
import {Principal} from '@dfinity/principal';
import {createAgent, isNullish} from '@dfinity/utils';
import type {_SERVICE as Icrc21Actor} from '../declarations/icrc-21';
import {idlFactory} from '../declarations/icrc-21.idl';
import type {PrincipalText} from '../types/principal';
import type {SignerOptions} from '../types/signer-options';

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
  owner: identity,
  host
}: {
  canisterId: string | Principal;
  idlFactory: IDL.InterfaceFactory;
} & SignerOptions): Promise<ActorSubclass<T>> => {
  const mainnetHost = 'https://icp-api.io';

  const {hostname} = new URL(host ?? mainnetHost);

  const local = ['localhost', '127.0.0.1'].includes(hostname);

  const agent = await createAgent({
    identity,
    ...(local && {fetchRootKey: true}),
    host: host ?? mainnetHost
  });

  return await Actor.createActor(idlFactory, {
    agent,
    canisterId
  });
};
