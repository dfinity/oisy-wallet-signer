import {SignerErrorCode} from '../constants/signer.constants';

export const mockErrorNotify = {
  code: SignerErrorCode.ACTION_ABORTED,
  message: 'The signer has canceled the action requested by the relying party.'
};
