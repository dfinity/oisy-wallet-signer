import {buildContentMessageIcrc1Transfer, buildContentMessageIcrc2Approve} from '../builders/signer.builders';
import {SignerBuilderFn, SignerBuilderMethods} from '../types/signer-builders';

export const SIGNER_BUILDERS: Record<SignerBuilderMethods, SignerBuilderFn> = {
  icrc1_transfer: buildContentMessageIcrc1Transfer,
  icrc2_approve: buildContentMessageIcrc2Approve
};
