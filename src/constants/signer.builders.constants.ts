import {
  buildContentMessageIcrc1Transfer,
  buildContentMessageIcrc2Approve,
  buildContentMessageIcrc2TransferFrom
} from '../builders/signer.builders';
import {SignerBuilderFn, SignerBuilderMethods} from '../types/signer-builders';

// @see {@link https://github.com/dfinity/ic/blob/master/packages/icrc-ledger-types/src/icrc21/lib.rs#L20}
export const MAX_CONSENT_MESSAGE_ARG_SIZE_BYTES = 500;

export const SIGNER_BUILDERS: Record<SignerBuilderMethods, SignerBuilderFn> = {
  icrc1_transfer: buildContentMessageIcrc1Transfer,
  icrc2_approve: buildContentMessageIcrc2Approve,
  icrc2_transfer_from: buildContentMessageIcrc2TransferFrom
};
