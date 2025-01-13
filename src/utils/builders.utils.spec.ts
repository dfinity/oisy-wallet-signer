import {asciiStringToByteArray} from '@dfinity/utils';
import {decodeMemo} from './builders.utils';

describe('builders.utils', () => {
  const memoText = 'PUPT'; // Reverse top-up memo

  const memo = asciiStringToByteArray(memoText);

  it('should return memo utf-8', () => {
    const result = decodeMemo(memo);

    expect(result).toEqual(memoText);
  });

  it('should return memo hex', () => {
    vi.stubGlobal(
      'TextDecoder',
      class {
        decode(_buffer: ArrayBuffer): string {
          throw new Error();
        }
      }
    );

    const result = decodeMemo(memo);

    expect(result).toEqual('0x50555054');

    vi.unstubAllGlobals();
  });
});
