import {Actor, type ActorMethod, type ActorSubclass} from '@dfinity/agent';
import type {IDL} from '@dfinity/candid';
import {Principal} from '@dfinity/principal';
import {isNullish} from '@dfinity/utils';
import type {
  _SERVICE as Icrc21Actor,
  icrc21_consent_message_request,
  icrc21_consent_message_response
} from '../declarations/icrc-21';
import {idlFactory} from '../declarations/icrc-21.idl';
import type {PrincipalText} from '../types/principal';
import type {SignerOptions} from '../types/signer-options';
import {AgentApi} from './agent.api';

export class Icrc21Canister extends AgentApi {
  #actors: Record<PrincipalText, ActorSubclass<Icrc21Actor>> | undefined;

  async consentMessage({
    request,
    ...actorParams
  }: {
    canisterId: string | Principal;
    request: icrc21_consent_message_request;
  } & SignerOptions): Promise<icrc21_consent_message_response> {
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
        idlFactory,
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
    const agent = await this.getAgent({host, owner});

    return await Actor.createActor(idlFactory, {
      agent,
      canisterId
    });
  }
}
