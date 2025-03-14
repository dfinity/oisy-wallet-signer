import {SignerErrorCode} from '../constants/signer.constants';
import type {Notify} from '../types/signer-handlers';
import {notifyError} from './signer.handlers';

export const notifyErrorRequestNotSupported = ({
  message,
  ...notify
}: Notify & {message?: string}): void => {
  notifyError({
    ...notify,
    error: {
      code: SignerErrorCode.REQUEST_NOT_SUPPORTED,
      message: message ?? 'The request sent by the relying party is not supported by the signer.'
    }
  });
};

export const notifyErrorActionAborted = (notify: Notify): void => {
  notifyError({
    ...notify,
    error: {
      code: SignerErrorCode.ACTION_ABORTED,
      message: 'The signer has canceled the action requested by the relying party.'
    }
  });
};

export const notifyNetworkError = ({message, ...notify}: Notify & {message: string}): void => {
  notifyError({
    ...notify,
    error: {
      code: SignerErrorCode.NETWORK_ERROR,
      message
    }
  });
};

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

export const notifyErrorMissingPrompt = (notify: Notify): void => {
  notifyError({
    ...notify,
    error: {
      code: SignerErrorCode.PERMISSIONS_PROMPT_NOT_REGISTERED,
      message: 'The signer has not registered a prompt to respond to permission requests.'
    }
  });
};

export const notifyErrorSenderNotAllowed = (notify: Notify): void => {
  notifyError({
    ...notify,
    error: {
      code: SignerErrorCode.SENDER_NOT_ALLOWED,
      message: 'The sender must match the owner of the signer.'
    }
  });
};

export const notifyErrorBusy = (notify: Notify): void => {
  notifyError({
    ...notify,
    error: {
      code: SignerErrorCode.BUSY,
      message:
        'The signer is currently processing a request and cannot handle new requests at this time.'
    }
  });
};

export const notifyErrorNotInitialized = (notify: Notify): void => {
  notifyError({
    ...notify,
    error: {
      code: SignerErrorCode.NOT_INITIALIZED,
      message: 'The signer does not have an owner set.'
    }
  });
};
