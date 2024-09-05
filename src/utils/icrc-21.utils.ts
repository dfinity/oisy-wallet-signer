import type {icrc21_error} from '../declarations/icrc-21';

export const mapIcrc21ErrorToString = (error: icrc21_error): string => {
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
