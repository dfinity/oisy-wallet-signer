import type {Principal} from '@dfinity/principal';
import type {IcrcScopesArray} from '../types/icrc-responses';
import type {SessionPermissions} from '../types/signer-sessions';
import {set} from '../utils/storage.utils';

const KEY_PREFIX = 'oisy_signer';

export const savePermissions = ({
  owner,
  origin,
  scopes
}: {
  owner: Principal;
  origin: string;
  scopes: IcrcScopesArray;
}): void => {
  const key = `${KEY_PREFIX}_${origin}_${owner.toText()}`;

  const value: SessionPermissions = {
    scopes,
    createdAt: Date.now()
  };

  set({key, value});
};
