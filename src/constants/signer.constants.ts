import type {IcrcScopesArray, IcrcSupportedStandards} from '../types/icrc-responses';
import {IcrcScopedMethodSchema, IcrcStandardSchema} from '../types/icrc-standards';
import {ICRC25_PERMISSION_ASK_ON_USE} from './icrc.constants';

export enum SignerErrorCode {
  /**
   * The relying party's origin is not allowed to interact with the signer.
   */
  ORIGIN_ERROR = 500,

  /**
   * The signer has not registered a prompt to respond to permission requests.
   */
  PERMISSIONS_PROMPT_NOT_REGISTERED = 501,

  /**
   * The sender of a canister call does not match the owner of the signer.
   */
  SENDER_NOT_ALLOWED = 502,

  /**
   * The signer is currently processing a request and cannot handle new requests.
   */
  BUSY = 503,

  /**
   * Owner is not set on the signer.
   */
  NOT_INITIALIZED = 504,

  /**
   * A generic error.
   * @see https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#errors
   */
  GENERIC_ERROR = 1000,

  /**
   * The request sent by the relying party is not supported by the signer.
   *
   * @see https://github.com/dfinity/wg-identity-authentication/blob/docs/fix-get-accounts/topics/icrc_25_signer_interaction_standard.md#errors-3
   */
  REQUEST_NOT_SUPPORTED = 2000,

  /**
   * An error is thrown when the permission to perform a feature is denied.
   * @see https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#errors
   */
  PERMISSION_NOT_GRANTED = 3000,

  /**
   * An error is thrown when the user cancel or deny an action.
   * @see https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#errors-3
   */
  ACTION_ABORTED = 3001,

  /**
   * An unexpected "network" error happened. Like not being able to call the IC.
   * @see https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#errors-3
   */
  NETWORK_ERROR = 4000
}

export const SIGNER_SUPPORTED_STANDARDS: IcrcSupportedStandards = Object.values(
  IcrcStandardSchema.enum
).map((name) => ({
  name,
  url: `https://github.com/dfinity/ICRC/blob/main/ICRCs/${name}/${name}.md`
}));

export const SIGNER_DEFAULT_SCOPES: IcrcScopesArray = Object.values(
  IcrcScopedMethodSchema.enum
).map((method) => ({scope: {method}, state: ICRC25_PERMISSION_ASK_ON_USE}));

export const SIGNER_PERMISSION_VALIDITY_PERIOD_IN_MILLISECONDS = 7 * 24 * 60 * 60 * 1000; // 7 days
