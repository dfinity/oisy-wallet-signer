import type {Principal} from '@dfinity/principal';
import {isNullish} from '@dfinity/utils';
import {ICRC25_PERMISSION_ASK_ON_USE} from '../constants/icrc.constants';
import {SIGNER_PERMISSION_VALIDITY_PERIOD_IN_MILLISECONDS} from '../constants/signer.constants';
import {IcrcWalletPermissionState, IcrcWalletScopedMethod} from '../types/icrc';
import {IcrcScopesArray} from '../types/icrc-responses';
import type {SessionPermissions} from '../types/signer-sessions';
import {get, set} from '../utils/storage.utils';

const KEY_PREFIX = 'oisy_signer';

interface SessionParams {
  owner: Principal;
  origin: string;
}

const key = ({owner, origin}: SessionParams): string => `${KEY_PREFIX}_${origin}_${owner.toText()}`;

export const savePermissions = ({
  scopes,
  ...rest
}: SessionParams & {
  scopes: IcrcScopesArray;
}): void => {
  const value: SessionPermissions = {
    scopes,
    createdAt: Date.now()
  };

  set({key: key(rest), value});
};

export const readValidPermissions = (params: SessionParams): SessionPermissions | undefined => {
  const permissions = get<SessionPermissions>({key: key(params)});

  if (isNullish(permissions)) {
    return undefined;
  }

  // TODO: We can improve the UX by "tracking" when the user is using a feature of the signer.
  // For example:
  // 1. Checking if the signer was last used within the past seven days.
  // 2. Comparing the creation date was granted within the last 30 days.
  if (permissions.createdAt < Date.now() - SIGNER_PERMISSION_VALIDITY_PERIOD_IN_MILLISECONDS) {
    return undefined;
  }

  return permissions;
};

export const permissionState = ({
  method,
  ...rest
}: SessionParams & {method: IcrcWalletScopedMethod}): IcrcWalletPermissionState => {
  const permissions = readValidPermissions(rest);

  return (
    permissions?.scopes.find(({scope: {method: m}}) => m === method)?.state ??
    ICRC25_PERMISSION_ASK_ON_USE
  );
};
