import {
  buildContentMessageIcrc1Transfer,
  buildContentMessageIcrc2Approve,
  buildContentMessageIcrc2TransferFrom
} from '../builders/signer.builders';
import {SignerBuilderFn, SignerBuilderMethods} from '../types/signer-builders';

export const SIGNER_BUILDERS: Record<SignerBuilderMethods, SignerBuilderFn> = {
  icrc1_transfer: buildContentMessageIcrc1Transfer,
  icrc2_approve: buildContentMessageIcrc2Approve,
  icrc2_transfer_from: buildContentMessageIcrc2TransferFrom
};
