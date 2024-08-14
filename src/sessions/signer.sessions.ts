import type {Principal} from '@dfinity/principal';
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

export const readPermissions = (params: SessionParams): SessionPermissions | undefined => {
  // TODO: cleanup expired permissions

  return get<SessionPermissions>({key: key(params)});
};
