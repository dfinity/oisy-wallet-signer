import {arrayOfNumberToUint8Array, uint8ArrayToHexString} from '@dfinity/utils';

/**
 * Decodes a memo into an utf-8 string. If decoding fails, fallback to hex.
 *
 * This is similar to how the decoder for consent messages of the ICP ledger handles the memo.
 *
 * @see {@link https://github.com/dfinity/ic/blob/master/packages/icrc-ledger-types/src/icrc21/lib.rs#L348}
 *
 * @param {Uint8Array | number[]} memo - The memo to decode. It can be either a `Uint8Array` or an array of numbers.
 * @returns {string} The decoded string if successful, or the hexadecimal string representation if decoding fails.
 */
export const decodeMemo = (memo: Uint8Array | number[]): string => {
  const memoArray = memo instanceof Uint8Array ? memo : arrayOfNumberToUint8Array(memo);

  try {
    return new TextDecoder('utf-8').decode(memoArray);
  } catch (_err: unknown) {
    return `0x${uint8ArrayToHexString(memo)}`;
  }
};
