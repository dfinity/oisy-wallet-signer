import {Expiry, JSON_KEY_EXPIRY} from '@dfinity/agent';

// Expiry doesn't have a fromBigInt static method yet.
// TODO: `@dfinity/agent` is planning to add a Expiry.fromBigInt method, so we can use it once it's released.
export const bigIntToExpiry = (val: bigint): Expiry => {
  const jsonExpiry = JSON.stringify({[JSON_KEY_EXPIRY]: val.toString()});
  return Expiry.fromJSON(jsonExpiry);
};
