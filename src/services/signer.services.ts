import {Principal} from '@dfinity/principal';
import {isNullish} from '@dfinity/utils';
import {consentMessage} from '../api/canister.api';
import type {icrc21_consent_info} from '../declarations/icrc-21';
import {
  notifyErrorActionAborted,
  notifyErrorRequestNotSupported,
  notifyMissingPromptError,
  notifyNetworkError,
  notifySenderNotAllowedError
} from '../handlers/signer-errors.handlers';
import type {IcrcCallCanisterRequestParams} from '../types/icrc-requests';
import type {Notify} from '../types/signer-handlers';
import type {SignerOptions} from '../types/signer-options';
import type {CallCanisterPrompt, ConsentMessageAnswer} from '../types/signer-prompts';
import {mapIcrc21ErrorToString} from '../utils/icrc-21.utils';

export const assertAndPromptConsentMessage = async ({
  params: {canisterId, method, arg, sender},
  prompt,
  notify,
  options: {owner, host}
}: {
  params: IcrcCallCanisterRequestParams;
  prompt: CallCanisterPrompt | undefined;
  notify: Notify;
  options: SignerOptions;
}): Promise<{result: 'approved' | 'rejected' | 'error'}> => {
  const {result: senderMatchOwner} = assertSender({sender, owner, notify});

  if (senderMatchOwner === 'invalid') {
    return {result: 'error'};
  }

  // The consumer currently has no way to unregister the prompt, so we know that it is defined. However, to be future-proof, it's better to ensure it is defined.
  if (isNullish(prompt)) {
    notifyMissingPromptError(notify);
    return {result: 'error'};
  }

  try {
    const response = await consentMessage({
      owner,
      host,
      canisterId,
      request: {
        method,
        arg,
        // TODO: consumer should be able to define user_preferences
        user_preferences: {
          metadata: {
            language: 'en',
            utc_offset_minutes: []
          },
          device_spec: []
        }
      }
    });

    if ('Err' in response) {
      const {Err} = response;

      notifyErrorRequestNotSupported({
        ...notify,
        message: mapIcrc21ErrorToString(Err)
      });

      return {result: 'error'};
    }

    const {Ok: consentInfo} = response;

    const {result} = await promptConsentMessage({consentInfo, prompt});

    if (result === 'rejected') {
      notifyErrorActionAborted(notify);
    }

    return {result};
  } catch (err: unknown) {
    // TODO: 2000 for not supported consent message - i.e. method is not implemented.
    // TODO: Likewise for example if canister is out of cycles or stopped etc. it should not throw 4000.

    notifyNetworkError({
      ...notify,
      message: err instanceof Error ? err.message : 'An unknown error occurred'
    });

    return {result: 'error'};
  }
};

export const callCanister = async ({
  params,
  notify,
  options: {owner, host}
}: {
  params: IcrcCallCanisterRequestParams;
  notify: Notify;
  options: SignerOptions;
}): Promise<{result: 'success' | 'error'}> => {
  return {result: 'success'};
};

const assertSender = ({
  notify,
  owner,
  sender
}: {notify: Notify} & Pick<SignerOptions, 'owner'> &
  Pick<IcrcCallCanisterRequestParams, 'sender'>): {result: 'valid' | 'invalid'} => {
  if (owner.getPrincipal().toText() === Principal.fromText(sender).toText()) {
    return {result: 'valid'};
  }

  notifySenderNotAllowedError(notify);

  return {result: 'invalid'};
};

const promptConsentMessage = async ({
  prompt,
  consentInfo
}: {
  consentInfo: icrc21_consent_info;
  prompt: CallCanisterPrompt;
}): Promise<{result: 'approved' | 'rejected'}> => {
  const promise = new Promise<{result: 'approved' | 'rejected'}>((resolve) => {
    const approve: ConsentMessageAnswer = () => {
      resolve({result: 'approved'});
    };

    const userReject: ConsentMessageAnswer = () => {
      resolve({result: 'rejected'});
    };

    prompt({approve, reject: userReject, consentInfo});
  });

  return await promise;
};
