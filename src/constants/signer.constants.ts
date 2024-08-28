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
  PERMISSION_NOT_GRANTED = 3000
}

export const SIGNER_SUPPORTED_STANDARDS: IcrcSupportedStandards = Object.values(
  IcrcStandardSchema.Values
).map((name) => ({
  name,
  url: `https://github.com/dfinity/ICRC/blob/main/ICRCs/${name}/${name}.md`
}));

export const SIGNER_DEFAULT_SCOPES: IcrcScopesArray = Object.values(
  IcrcScopedMethodSchema.Values
).map((method) => ({scope: {method}, state: ICRC25_PERMISSION_ASK_ON_USE}));

export const SIGNER_PERMISSION_VALIDITY_PERIOD_IN_MILLISECONDS = 7 * 24 * 60 * 60 * 1000; // 7 days
