import type {Principal} from '@dfinity/principal';
import {isNullish} from '@dfinity/utils';
import {SIGNER_PERMISSION_VALIDITY_PERIOD_IN_MILLISECONDS} from '../constants/signer.constants';
import type {IcrcScopesArray} from '../types/icrc-responses';
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

  if (permissions.createdAt < Date.now() - SIGNER_PERMISSION_VALIDITY_PERIOD_IN_MILLISECONDS) {
    return undefined;
  }

  return permissions;
};
