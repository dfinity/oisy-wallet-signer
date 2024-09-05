import {isNullish} from '@dfinity/utils';
import {consentMessage} from '../api/canister.api';
import {SignerErrorCode} from '../constants/signer.constants';
import type {icrc21_consent_info} from '../declarations/icrc-21';
import {notifyError} from '../handlers/signer.handlers';
import type {IcrcCallCanisterRequestParams} from '../types/icrc-requests';
import {MissingPromptError} from '../types/signer-errors';
import type {Notify} from '../types/signer-handlers';
import type {SignerOptions} from '../types/signer-options';
import type {ConsentMessageAnswer, ConsentMessagePrompt} from '../types/signer-prompts';
import {mapIcrc21ErrorToString} from '../utils/icrc-21.utils';

export const assertAndPromptConsentMessage = async ({
  params: {canisterId, method, arg},
  prompt,
  notify,
  options
}: {
  params: IcrcCallCanisterRequestParams;
  prompt: ConsentMessagePrompt | undefined;
  notify: Notify;
  options: SignerOptions;
}): Promise<{result: 'approved' | 'rejected' | 'error'}> => {
  // TODO: asserting that the sender = owner of the accounts = principal derived by II in the signer
  // i.e. sender === this.#owner

  try {
    const response = await consentMessage({
      ...options,
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

    return await promptConsentMessage({consentInfo, prompt});
  } catch (err: unknown) {
    // TODO: 2000 for not supported consent message - i.e. method is not implemented
    // TODO: fine grained error for example out of cycles, stopped etc. should not throw 4000
    // TODO: notify error 4000
    return {result: 'error'};
  }
};

const promptConsentMessage = async ({
  prompt,
  consentInfo
}: {
  consentInfo: icrc21_consent_info;
  prompt: ConsentMessagePrompt | undefined;
}): Promise<{result: 'approved' | 'rejected'}> => {
  const promise = new Promise<{result: 'approved' | 'rejected'}>((resolve, reject) => {
    const approve: ConsentMessageAnswer = () => {
      resolve({result: 'approved'});
    };

    const userReject: ConsentMessageAnswer = () => {
      // TODO: error 3001
      resolve({result: 'rejected'});
    };

    // The consumer currently has no way to unregister the prompt, so we know that it is defined. However, to be future-proof, it's better to ensure it is defined.
    if (isNullish(prompt)) {
      reject(new MissingPromptError());
      return;
    }

    prompt({approve, reject: userReject, consentInfo});
  });

  return await promise;
};

export const notifyErrorRequestNotSupported = ({
  message,
  ...notify
}: Notify & {message?: string}): void => {
  notifyError({
    ...notify,
    error: {
      code: SignerErrorCode.REQUEST_NOT_SUPPORTED,
      message: message ?? 'The request sent by the relying party is not supported by the signer.'
    }
  });
};

export const notifyErrorPermissionNotGranted = (notify: Notify): void => {
  notifyError({
    ...notify,
    error: {
      code: SignerErrorCode.PERMISSION_NOT_GRANTED,
      message:
        'The signer has not granted the necessary permissions to process the request from the relying party.'
    }
  });
};
