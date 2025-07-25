import {Principal} from '@dfinity/principal';
import {mockPrincipalText} from '../mocks/icrc-accounts.mocks';
import {PrincipalObjSchema} from './principal';

describe('PrincipalObjSchema', () => {
  it('parses a valid PrincipalObj and returns a Principal', () => {
    const principal = Principal.fromText(mockPrincipalText);

    const input = {
      _isPrincipal: true,
      _arr: principal.toUint8Array()
    };

    const result = PrincipalObjSchema.safeParse(input);

    expect(result.success).toBeTruthy();
    expect(result.data).toBeInstanceOf(Principal);
    expect(result?.data?.toText()).toBe(principal.toText());
  });

  it('parses a valid Principal and returns a Principal', () => {
    const principal = Principal.fromText(mockPrincipalText);

    const result = PrincipalObjSchema.safeParse(principal);

    expect(result.success).toBeTruthy();
    expect(result.data).toBeInstanceOf(Principal);
    expect(result?.data?.toText()).toBe(principal.toText());
  });

  it('fails if _isPrincipal is missing', () => {
    const result = PrincipalObjSchema.safeParse({
      _arr: new Uint8Array()
    });

    expect(result.success).toBeFalsy();
    expect(result?.error?.issues[0].path).toEqual(['_isPrincipal']);
  });

  it('fails if _arr is not a Uint8Array', () => {
    const result = PrincipalObjSchema.safeParse({
      _isPrincipal: true,
      _arr: [1, 2, 3]
    });

    expect(result.success).toBeFalsy();
    expect(result?.error?.issues[0].path).toEqual(['_arr']);
  });

  it('fails if there are extra properties', () => {
    const result = PrincipalObjSchema.safeParse({
      _isPrincipal: true,
      _arr: new Uint8Array(),
      extra: 'nope'
    });

    expect(result.success).toBeFalsy();
    expect(result?.error?.issues[0].code).toBe('unrecognized_keys');
    expect(result?.error?.issues[0].path).toEqual([]);
  });
});
