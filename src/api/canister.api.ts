import type {Identity} from '@dfinity/agent';
import type {Principal} from '@dfinity/principal';
import type {
  icrc21_consent_message_request,
  icrc21_consent_message_response
} from '../declarations/icrc-21';
import {getIcrc21Actor} from './actors.api';

export const consentMessage = async ({
  request,
  ...actorParams
}: {
  identity: Identity;
  canisterId: string | Principal;
  request: icrc21_consent_message_request;
}): Promise<icrc21_consent_message_response> => {
  const {icrc21_canister_call_consent_message: canisterCallConsentMessage} =
    await getIcrc21Actor(actorParams);
  return await canisterCallConsentMessage(request);
};
