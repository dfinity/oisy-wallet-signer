import {Expiry} from '@dfinity/agent';

export function expiryToMs(expiry: Expiry): number {
  return Number(expiry['_value'] / 1000000n);
}