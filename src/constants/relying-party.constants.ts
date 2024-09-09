import type {IcrcRequestedScopes} from '../types/icrc-requests';
import {IcrcScopedMethodSchema} from '../types/icrc-standards';
import type {WindowOptions} from '../types/relying-party-options';

const RELYING_PARTY_TIMEOUT_IN_MILLISECONDS_WITH_USER_INTERACTION = 60 * 2 * 1000;
const RELYING_PARTY_TIMEOUT_IN_MILLISECONDS_WITHOUT_USER_INTERACTION = 5000;

export const RELYING_PARTY_CONNECT_TIMEOUT_IN_MILLISECONDS =
  RELYING_PARTY_TIMEOUT_IN_MILLISECONDS_WITH_USER_INTERACTION;
export const RELYING_PARTY_TIMEOUT_REQUEST_SUPPORTED_STANDARD =
  RELYING_PARTY_TIMEOUT_IN_MILLISECONDS_WITHOUT_USER_INTERACTION;
export const RELYING_PARTY_TIMEOUT_REQUEST_PERMISSIONS =
  RELYING_PARTY_TIMEOUT_IN_MILLISECONDS_WITH_USER_INTERACTION;
export const RELYING_PARTY_TIMEOUT_PERMISSIONS =
  RELYING_PARTY_TIMEOUT_IN_MILLISECONDS_WITHOUT_USER_INTERACTION;
export const RELYING_PARTY_TIMEOUT_ACCOUNTS =
  RELYING_PARTY_TIMEOUT_IN_MILLISECONDS_WITH_USER_INTERACTION;
export const RELYING_PARTY_TIMEOUT_CALL_CANISTER =
  RELYING_PARTY_TIMEOUT_IN_MILLISECONDS_WITH_USER_INTERACTION;

export const RELYING_PARTY_DEFAULT_SCOPES: IcrcRequestedScopes = {
  scopes: Object.values(IcrcScopedMethodSchema.Values).map((method) => ({method}))
};

export const RELYING_PARTY_SIGNER_WINDOW_FEATURES =
  'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=no, copyhistory=no';

export const RELYING_PARTY_SIGNER_WINDOW_TOP_RIGHT: WindowOptions = {
  position: 'top-right',
  width: 350,
  height: 600,
  features: RELYING_PARTY_SIGNER_WINDOW_FEATURES
};

export const RELYING_PARTY_SIGNER_WINDOW_CENTER: WindowOptions = {
  position: 'center',
  width: 576,
  height: 625,
  features: RELYING_PARTY_SIGNER_WINDOW_FEATURES
};
