import type {IcrcSupportedStandards} from '../types/icrc-responses';

export enum SignerErrorCode {
  /**
   * The relying party's origin is not allowed to interact with the signer.
   */
  ORIGIN_ERROR = 500,

  /**
   * The request sent by the relying party is not supported by the signer.
   */
  REQUEST_NOT_SUPPORTED = 501
}

export const SIGNER_SUPPORTED_STANDARDS: IcrcSupportedStandards = [
  {
    name: 'ICRC-25',
    url: 'https://github.com/dfinity/ICRC/blob/main/ICRCs/ICRC-25/ICRC-25.md'
  }
];
