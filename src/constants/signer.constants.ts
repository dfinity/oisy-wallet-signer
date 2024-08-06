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
