import {SignerErrorCode} from '../constants/signer.constants';
import {notifyError} from '../handlers/signer.handlers';
import type {Notify} from '../types/signer-handlers';

export const notifyErrorPermissionNotGranted = (notify: Notify): void => {
  notifyError({
    ...notify,
    error: {
      code: SignerErrorCode.PERMISSION_NOT_GRANTED,
      message:
        'The signer has not granted the necessary permissions to process the request from the relying party.'
    }
  });
};
