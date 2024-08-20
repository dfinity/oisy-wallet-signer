import type {Principal} from '@dfinity/principal';
import {isNullish} from '@dfinity/utils';
import {SIGNER_PERMISSION_VALIDITY_PERIOD_IN_MILLISECONDS} from '../constants/signer.constants';
import type {IcrcScopesArray} from '../types/icrc-responses';
import type {SessionIcrcScope, SessionPermissions} from '../types/signer-sessions';
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
  const permissionKey = key(rest);

  const permissions = get<SessionPermissions>({key: permissionKey});

  const retainScopes = (permissions?.scopes ?? []).filter(
    ({scope: {method: existingMethod}}) =>
      scopes.find(({scope: {method}}) => existingMethod === method) === undefined
  );

  const now = Date.now();

  const updateScopes = scopes.reduce<SessionIcrcScope[]>(
    (acc, {scope: {method, ...scopeRest}, ...rest}) => {
      const existingScope: SessionIcrcScope | undefined = (permissions?.scopes ?? []).find(
        ({scope: {method: existingMethod}}) => existingMethod === method
      );

      return [
        ...acc,
        {
          ...rest,
          scope: {
            ...scopeRest,
            method
          },
          createdAt: existingScope?.createdAt ?? now,
          updatedAt: now
        }
      ];
    },
    []
  );

  const updatedPermissions: SessionPermissions = {
    scopes: [...retainScopes, ...updateScopes],
    createdAt: permissions?.createdAt ?? now,
    updatedAt: now
  };

  set({key: permissionKey, value: updatedPermissions});
};

export const readValidPermissions = (params: SessionParams): IcrcScopesArray | undefined => {
  const permissions = get<SessionPermissions>({key: key(params)});

  if (isNullish(permissions)) {
    return undefined;
  }

  // TODO: We can improve the UX by "tracking" when the user is using a feature of the signer.
  // For example:
  // 1. Checking if the signer was last used within the past seven days.
  // 2. Comparing the creation date was granted within the last 30 days.
  return permissions.scopes
    .filter(
      ({updatedAt}) => updatedAt >= Date.now() - SIGNER_PERMISSION_VALIDITY_PERIOD_IN_MILLISECONDS
    )
    .map(({updatedAt: _, createdAt: __, ...rest}) => ({...rest}));
};
