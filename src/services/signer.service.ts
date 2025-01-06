import {mapTokenMetadata} from '@dfinity/ledger-icrc';
import {Principal} from '@dfinity/principal';
import {isNullish, notEmptyString} from '@dfinity/utils';
import {SignerApi} from '../api/signer.api';
import {SIGNER_BUILDERS} from '../constants/signer.builders.constants';
import {icrc21_consent_message_response} from '../declarations/icrc-21';
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
import {
  CallCanisterPrompt,
  ConsentInfoWarn,
  ConsentMessageApproval,
  ConsentMessagePrompt,
  ResultConsentMessage
} from '../types/signer-prompts';
import {base64ToUint8Array} from '../utils/base64.utils';
import {mapIcrc21ErrorToString} from '../utils/icrc-21.utils';

export class SignerService {
  readonly #signerApi = new SignerApi();

  async assertAndPromptConsentMessage({
    params: {sender, ...params},
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
      const response = await this.loadConsentMessage({
        params,
        options: {host, owner}
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

      const {result} = await this.promptConsentMessage({
        consentInfo: response,
        prompt,
        origin
      });

      if (result === 'rejected') {
        notifyErrorActionAborted(notify);
      }

      return {result};
    } catch (err: unknown) {
      return this.notifyError({err, prompt, notify});
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

  private async callConsentMessage({
    params: {canisterId, method, arg},
    options: {owner, host}
  }: {
    params: Omit<IcrcCallCanisterRequestParams, 'sender'>;
    options: SignerOptions;
  }): Promise<icrc21_consent_message_response> {
    return await this.#signerApi.consentMessage({
      owner,
      host,
      canisterId,
      request: {
        method,
        arg: base64ToUint8Array(arg),
        // TODO: consumer should be able to define user_preferences
        user_preferences: {
          metadata: {
            // TODO: support i18n
            language: 'en',
            utc_offset_minutes: []
          },
          device_spec: []
        }
      }
    });
  }

  private notifyError({
    err,
    notify,
    prompt
  }: {
    err: unknown;
    notify: Notify;
    prompt: ConsentMessagePrompt;
  }): {result: 'error'} {
    // TODO: 2001 for not supported consent message - i.e. method is not implemented.
    // see https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_49_call_canister.md#errors

    // TODO: Likewise for example if canister is out of cycles or stopped etc. it should not throw 4000.

    const {origin} = notify;

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

  /**
   * If the ICRC-21 call to fetch the consent message fails, it might be due to the fact
   * that the targeted canister does not implement the ICRC-21 specification.
   *
   * To address the potential lack of support for the most common types of calls for ledgers,
   * namely transfer and approve, we use custom builders. Those builders construct
   * messages similar to those that would be implemented by the canisters.
   *
   * @param {Object} params - The parameters for loading the consent message.
   * @param {Omit<IcrcCallCanisterRequestParams, 'sender'>} params.params - The ICRC call canister parameters minus the sender.
   * @param {SignerOptions} params.options - The signer options - host and owner.
   * @returns {Promise<icrc21_consent_message_response | ConsentInfoWarn>} - A consent message response. Returns "Ok" if the message was decoded by the targeted canister, or "Warn" if the fallback builder was used.
   * @throws The potential original error from the ICRC-21 call. The errors related to
   *         the custom builder is ignored.
   **/
  private async loadConsentMessage(params: {
    params: Omit<IcrcCallCanisterRequestParams, 'sender'>;
    options: SignerOptions;
  }): Promise<icrc21_consent_message_response | ConsentInfoWarn> {
    try {
      return await this.callConsentMessage(params);
    } catch (err: unknown) {
      const fallbackMessage = await this.tryBuildConsentMessageOnError(params);

      if ('Warn' in fallbackMessage) {
        return fallbackMessage;
      }

      throw err;
    }
  }

  private async tryBuildConsentMessageOnError({
    params: {method, arg, canisterId},
    options: {owner, host}
  }: {
    params: Omit<IcrcCallCanisterRequestParams, 'sender'>;
    options: SignerOptions;
  }): Promise<{NoFallback: null} | ConsentInfoWarn | {Err: unknown}> {
    const fn = SIGNER_BUILDERS[method];

    if (isNullish(fn)) {
      return {NoFallback: null};
    }

    try {
      const tokenResponse = await this.#signerApi.ledgerMetadata({
        params: {canisterId},
        host,
        owner
      });

      const token = mapTokenMetadata(tokenResponse);

      if (isNullish(token)) {
        return {Err: new Error('Incomplete token metadata.')};
      }

      const result = await fn({
        arg: base64ToUint8Array(arg),
        token,
        owner: owner.getPrincipal()
      });

      if ('Err' in result) {
        return {Err: result.Err};
      }

      return {
        Warn: {
          consentInfo: result.Ok,
          method,
          arg,
          canisterId
        }
      };
    } catch (err: unknown) {
      return {Err: err};
    }
  }
}
