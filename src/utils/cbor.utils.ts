import type {CborValue} from '@dfinity/cbor';
import {ExpiryObjSchema} from '../types/expiry';
import {PrincipalObjSchema} from '../types/principal';

/**
 * A replacer function used to serialize specific fields of the contentMap.
 *
 * This function ensures:
 * - `ingress_expiry` is converted from an `Expiry` object to its internal `bigint` representation.
 * - `sender` and `canister_id` fields are converted from `Principal` objects to `Uint8Array`.
 *
 * These transformations maintain compatibility with the existing decoder in agent-js v2
 * while conforming to the IC spec for CBOR encoding.
 *
 * @template T - The underlying type of the CBOR value.
 * @param {CborValue<T>} [value] - The value to possibly transform.
 * @param {string} [key] - The key associated with the value during object traversal.
 * @returns {CborValue<T>} The transformed value if applicable, or the original value.
 */
// eslint-disable-next-line local-rules/prefer-object-params
export const contentMapReplacer = <T>(value?: CborValue<T>, key?: string): CborValue<T> => {
  if (key === 'ingress_expiry') {
    const {success, data} = ExpiryObjSchema.safeParse(value);

    if (success) {
      return data.toBigInt();
    }
  }

  if (['sender', 'canister_id'].includes(key ?? '')) {
    const {success, data} = PrincipalObjSchema.safeParse(value);

    if (success) {
      return data.toUint8Array();
    }
  }

  return value;
};
