import type {Principal} from '@dfinity/principal';
import type {
  icrc21_consent_message_request,
  icrc21_consent_message_response
} from '../declarations/icrc-21';
import type {SignerOptions} from '../types/signer-options';
import {getIcrc21Actor} from './actors.api';

export const consentMessage = async ({
  request,
  ...actorParams
}: {
  canisterId: string | Principal;
  request: icrc21_consent_message_request;
} & SignerOptions): Promise<icrc21_consent_message_response> => {

  console.log(request, actorParams);

  const {icrc21_canister_call_consent_message: canisterCallConsentMessage} =
    await getIcrc21Actor(actorParams);
  return await canisterCallConsentMessage(request);
};
