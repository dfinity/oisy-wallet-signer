import {buildContentMessageIcrc1Transfer} from '../builders/signer.builders';
import {SignerBuilderFn, SignerBuilderMethods} from '../types/signer-builders';

export const SIGNER_BUILDERS: Record<SignerBuilderMethods, SignerBuilderFn> = {
  icrc1_transfer: buildContentMessageIcrc1Transfer
};
