import {Principal} from '@dfinity/principal';
import {isNullish, notEmptyString} from '@dfinity/utils';
import {SignerApi} from '../api/signer.api';
import {
  notifyErrorActionAborted,
  notifyErrorMissingPrompt,
  notifyErrorRequestNotSupported,
  notifyErrorSenderNotAllowed,
  notifyNetworkError
} from '../handlers/signer-errors.handlers';
import {notifyCallCanister} from '../handlers/signer-success.handlers';
import type {IcrcCallCanisterRequestParams} from '../types/icrc-requests';
import type {Notify} from '../types/signer-handlers';
import type {SignerOptions} from '../types/signer-options';
import type {
  CallCanisterPrompt,
  ConsentMessageApproval,
  ConsentMessagePrompt,
  ResultConsentMessage
} from '../types/signer-prompts';
import {base64ToUint8Array} from '../utils/base64.utils';
import {mapIcrc21ErrorToString} from '../utils/icrc-21.utils';

export class SignerService {
  readonly #signerApi = new SignerApi();

  async assertAndPromptConsentMessage({
    params: {canisterId, method, arg, sender},
    prompt,
    notify,
    options: {owner, host}
  }: {
    params: IcrcCallCanisterRequestParams;
    prompt: ConsentMessagePrompt | undefined;
    notify: Notify;
    options: SignerOptions;
  }): Promise<{result: 'approved' | 'rejected' | 'error'}> {
    const {result: senderMatchOwner} = this.assertSender({sender, owner, notify});

    if (senderMatchOwner === 'invalid') {
      return {result: 'error'};
    }

    // The consumer currently has no way to unregister the prompt, so we know that it is defined. However, to be future-proof, it's better to ensure it is defined.
    if (isNullish(prompt)) {
      notifyErrorMissingPrompt(notify);
      return {result: 'error'};
    }

    const {origin} = notify;

    prompt({origin, status: 'loading'});

    try {
      const response = await this.#signerApi.consentMessage({
        owner,
        host,
        canisterId,
        request: {
          method,
          arg: base64ToUint8Array(arg),
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

        prompt({origin, status: 'error', details: Err});

        notifyErrorRequestNotSupported({
          ...notify,
          message: mapIcrc21ErrorToString(Err)
        });

        return {result: 'error'};
      }

      const {Ok: consentInfo} = response;

      const {result} = await this.promptConsentMessage({consentInfo, prompt, origin});

      if (result === 'rejected') {
        notifyErrorActionAborted(notify);
      }

      return {result};
    } catch (err: unknown) {
      // TODO: 2001 for not supported consent message - i.e. method is not implemented.
      // see https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_49_call_canister.md#errors

      // TODO: Likewise for example if canister is out of cycles or stopped etc. it should not throw 4000.

      prompt({origin, status: 'error', details: err});

      notifyNetworkError({
        ...notify,
        message:
          err instanceof Error && notEmptyString(err.message)
            ? err.message
            : 'An unknown error occurred'
      });

      return {result: 'error'};
    }
  }

  async callCanister({
    params,
    prompt,
    notify,
    options
  }: {
    params: IcrcCallCanisterRequestParams;
    prompt: CallCanisterPrompt | undefined;
    notify: Notify;
    options: SignerOptions;
  }): Promise<{result: 'success' | 'error'}> {
    const {origin} = notify;

    prompt?.({origin, status: 'executing'});

    try {
      const result = await this.#signerApi.call({
        ...options,
        params
      });

      notifyCallCanister({
        ...notify,
        result
      });

      prompt?.({origin, status: 'result', ...result});

      return {result: 'success'};
    } catch (err: unknown) {
      prompt?.({origin, status: 'error', details: err});

      notifyNetworkError({
        ...notify,
        message:
          err instanceof Error && notEmptyString(err.message)
            ? err.message
            : 'An unknown error occurred'
      });

      return {result: 'error'};
    }
  }

  private assertSender({
    notify,
    owner,
    sender
  }: {notify: Notify} & Pick<SignerOptions, 'owner'> &
    Pick<IcrcCallCanisterRequestParams, 'sender'>): {result: 'valid' | 'invalid'} {
    if (owner.getPrincipal().toText() === Principal.fromText(sender).toText()) {
      return {result: 'valid'};
    }

    notifyErrorSenderNotAllowed(notify);

    return {result: 'invalid'};
  }

  private async promptConsentMessage({
    prompt,
    ...payload
  }: {
    prompt: ConsentMessagePrompt;
  } & Pick<ResultConsentMessage, 'consentInfo' | 'origin'>): Promise<{
    result: 'approved' | 'rejected';
  }> {
    const promise = new Promise<{result: 'approved' | 'rejected'}>((resolve) => {
      const approve: ConsentMessageApproval = () => {
        resolve({result: 'approved'});
      };

      const userReject: ConsentMessageApproval = () => {
        resolve({result: 'rejected'});
      };

      prompt({status: 'result', approve, reject: userReject, ...payload});
    });

    return await promise;
  }
}
