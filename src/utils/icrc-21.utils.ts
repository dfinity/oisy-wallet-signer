import type {Icrc21Did} from '../declarations';

export const mapIcrc21ErrorToString = (error: Icrc21Did.icrc21_error): string => {
  if ('GenericError' in error) {
    return `Error: ${error.GenericError.description} (Code: ${error.GenericError.error_code})`;
  }

  if ('InsufficientPayment' in error) {
    return `Insufficient Payment: ${error.InsufficientPayment.description}`;
  }

  if ('UnsupportedCanisterCall' in error) {
    return `Unsupported Canister Call: ${error.UnsupportedCanisterCall.description}`;
  }

  if ('ConsentMessageUnavailable' in error) {
    return `Consent Message Unavailable: ${error.ConsentMessageUnavailable.description}`;
  }

  return 'Unknown error';
};
