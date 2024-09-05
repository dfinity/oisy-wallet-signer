import {isNullish} from '@dfinity/utils';
import {consentMessage} from '../api/canister.api';
import type {icrc21_consent_info} from '../declarations/icrc-21';
import type {IcrcCallCanisterRequestParams} from '../types/icrc-requests';
import type {RpcId} from '../types/rpc';
import {MissingPromptError} from '../types/signer-errors';
import type {SignerOptions} from '../types/signer-options';
import type {ConsentMessageAnswer, ConsentMessagePrompt} from '../types/signer-prompts';

export const assertAndPromptConsentMessage = async ({
  requestId,
  params: {canisterId, method, arg},
  prompt,
  ...rest
}: {
  params: IcrcCallCanisterRequestParams;
  requestId: RpcId;
  prompt: ConsentMessagePrompt | undefined;
} & SignerOptions): Promise<{result: 'approved' | 'rejected' | 'error'}> => {
  try {
    const response = await consentMessage({
      ...rest,
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
      // TODO: notify error
      return {result: 'error'};
    }

    const {Ok: consentInfo} = response;

    return await promptConsentMessage({consentInfo, prompt});
  } catch (err: unknown) {
    // TODO: notify error
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
