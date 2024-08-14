import {IcrcWalletStandardSchema} from '../types/icrc';
import type {IcrcSupportedStandards} from '../types/icrc-responses';

export enum SignerErrorCode {
  /**
   * The relying party's origin is not allowed to interact with the signer.
   */
  ORIGIN_ERROR = 500,

  /**
   * The request sent by the relying party is not supported by the signer.
   */
  REQUEST_NOT_SUPPORTED = 501,

  /**
   * A generic error.
   * @see https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#errors
   */
  GENERIC_ERROR = 1000,

  /**
   * An error is thrown when the permission to perform a feature is denied.
   * @see https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md#errors
   */
  PERMISSION_NOT_GRANTED = 3000
}

export const SIGNER_SUPPORTED_STANDARDS: IcrcSupportedStandards = Object.values(
  IcrcWalletStandardSchema.Values
).map((name) => ({
  name,
  url: `https://github.com/dfinity/ICRC/blob/main/ICRCs/${name}/${name}.md`
}));
