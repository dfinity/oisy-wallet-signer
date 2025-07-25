import {Expiry} from '@dfinity/agent';
import type {CborValue} from '@dfinity/cbor';
import {nonNullish} from '@dfinity/utils';
import {PrincipalObjSchema} from '../types/principal';

// eslint-disable-next-line local-rules/prefer-object-params
export const contentMapReplacer = <T>(value?: CborValue<T>, key?: string): CborValue<T> => {
  if (key === 'ingress_expiry' && nonNullish(value) && value instanceof Expiry) {
    return (value as unknown as {_value: bigint})._value;
  }

  if (['sender', 'canister_id'].includes(key ?? '')) {
    const {success, data} = PrincipalObjSchema.safeParse(value);

    if (success) {
      return data.toUint8Array();
    }
  }

  return value;
};
