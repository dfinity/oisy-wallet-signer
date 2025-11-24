import {isNullish} from '@dfinity/utils';
import type {PrincipalText} from '@dfinity/zod-schemas';
import {Actor, type ActorMethod, type ActorSubclass} from '@icp-sdk/core/agent';
import type {IDL} from '@icp-sdk/core/candid';
import {Principal} from '@icp-sdk/core/principal';
import {type Icrc21Actor, type Icrc21Did, idlFactoryIcrc21} from '../declarations';
import type {SignerOptions} from '../types/signer-options';
import {AgentApi} from './agent.api';

export class Icrc21Canister extends AgentApi {
  #actors: Record<PrincipalText, ActorSubclass<Icrc21Actor>> | undefined;

  async consentMessage({
    request,
    ...actorParams
  }: {
    canisterId: string | Principal;
    request: Icrc21Did.icrc21_consent_message_request;
  } & SignerOptions): Promise<Icrc21Did.icrc21_consent_message_response> {
    const {icrc21_canister_call_consent_message: canisterCallConsentMessage} =
      await this.getIcrc21Actor(actorParams);
    return await canisterCallConsentMessage(request);
  }

  protected async getIcrc21Actor({
    canisterId,
    ...rest
  }: {
    canisterId: string | Principal;
  } & SignerOptions): Promise<Icrc21Actor> {
    const id = canisterId instanceof Principal ? canisterId.toText() : canisterId;

    const {[id]: icrc21Actor} = this.#actors ?? {[id]: undefined};

    if (isNullish(icrc21Actor)) {
      const actor = await this.createActor<Icrc21Actor>({
        canisterId,
        idlFactory: idlFactoryIcrc21,
        ...rest
      });

      this.#actors = {
        ...(this.#actors ?? {}),
        [id]: actor
      };

      return actor;
    }

    return icrc21Actor;
  }

  private async createActor<T = Record<string, ActorMethod>>({
    canisterId,
    idlFactory,
    owner,
    host
  }: {
    canisterId: string | Principal;
    idlFactory: IDL.InterfaceFactory;
  } & SignerOptions): Promise<ActorSubclass<T>> {
    const {agent} = await this.getDefaultAgent({host, owner});

    return await Actor.createActor(idlFactory, {
      agent,
      canisterId
    });
  }
}
