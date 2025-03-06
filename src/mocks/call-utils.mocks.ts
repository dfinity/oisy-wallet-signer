/**
 * These values were copied from a test performed locally against a local replica of Juno Docker.
 */
import {Principal} from '@dfinity/principal';
import {IcrcCallCanisterRequestParams} from '../types/icrc-requests';
import {IcrcCallCanisterResult} from '../types/icrc-responses';

export const mockLocalRelyingPartyPrincipal = Principal.fromText(
  's3oqv-3j7id-xjhbm-3owbe-fvwly-oso6u-vej6n-bexck-koyu2-bxb6y-wae'
);

export const mockLocalCallParams: IcrcCallCanisterRequestParams = {
  arg: 'RElETAZte24AbAKzsNrDA2ithsqDBQFufW54bAb7ygECxvy2AgO6ieXCBAGi3pTrBgGC8/ORDATYo4yoDX0BBQEdP0Duk4WbdYJC1svDpO9SpE+aElxKU7FNBuH2LAIAAZBOAAAAwJaxAg==',
  canisterId: 'ryjl3-tyaaa-aaaaa-aaaba-cai',
  method: 'icrc1_transfer',
  sender: 'f2uoh-ddrrp-y5mqp-dwbtm-y67ln-pslmx-esrv3-ttjch-uvxie-mvgcb-4qe'
};

export const mockLocalCallParamswithNonce: IcrcCallCanisterRequestParams = {
  arg: 'RElETAZte24AbAKzsNrDA2ithsqDBQFufW54bAb7ygECxvy2AgO6ieXCBAGi3pTrBgGC8/ORDATYo4yoDX0BBQEdP0Duk4WbdYJC1svDpO9SpE+aElxKU7FNBuH2LAIAAZBOAAAAwJaxAg==',
  nonce: 'RElBuH2BOAAAAwJaxAg==',
  canisterId: 'ryjl3-tyaaa-aaaaa-aaaba-cai',
  method: 'icrc1_transfer',
  sender: 'f2uoh-ddrrp-y5mqp-dwbtm-y67ln-pslmx-esrv3-ttjch-uvxie-mvgcb-4qe'
};

export const mockLocalCallResult: IcrcCallCanisterResult = {
  certificate:
    '2dn3omlzaWduYXR1cmVYMIRlD8DyLTRm4cNY6ZYOIyTx/5MZ7bGHm2unaMz/78KwFhA++pJExycUC+ZdrleFtGR0cmVlgwGDAYIEWCBnoHoMNr/grlp/CTec5CDL8m2lBsedNjlIbnPEmQxfw4MBggRYIPQ0BrYO1QSm0QyNoDRxrTtwUFsidOwark3+6UV+JtxcgwJOcmVxdWVzdF9zdGF0dXODAYMBggRYIHmgpM2nhmBMmPTLNI4WwCwObyUBWpO58wQwfhjJhJDAgwGDAlggQBd9b5Wer4jblY8wZ41iWRNkXZT9L37cT9l1rL+cJv+DAYMCRXJlcGx5ggNYe0RJREwIawK8igF9xf7SAQFrCNHEmHwCwpHsuQJ/lMHHiQQD64KolwQEocPr/QcF8Ifm2wkGk+W+yAx/65zb1Q8HbALH68TQCXHEmLG1DX1sAZuzvqYKfWwBi73ymwF9bAG/m7fwDX1sAaO7kYwKeGwBnLq2nAJ9AQAAcoMCRnN0YXR1c4IDR3JlcGxpZWSCBFggf+PvzTp6ZYO4iR1pdq/Y8YNeG4MEPJXP4L8gGVbqOZmCBFggVwwB8Q5BRZqLTjr4nQIwBlx0QLT5Tm15csdqVWMZWn2DAYIEWCDf3DBRUg7g1jtKxYGDfk+uS85noU/fMxkHfyyhi82vfoMCRHRpbWWCA0nezZjXi6ip/Rc=',
  contentMap:
    '2dn3p2NhcmdYakRJREwGbXtuAGwCs7DawwNorYbKgwUBbn1ueGwG+8oBAsb8tgIDuonlwgQBot6U6wYBgvPzkQwE2KOMqA19AQUBHT9A7pOFm3WCQtbLw6TvUqRPmhJcSlOxTQbh9iwCAAGQTgAAAMCWsQJrY2FuaXN0ZXJfaWRKAAAAAAAAAAIBAW5pbmdyZXNzX2V4cGlyeRsX+qVy6MOwAGttZXRob2RfbmFtZW5pY3JjMV90cmFuc2ZlcmVub25jZVCS+EllEG6amSrgQoR0nIAabHJlcXVlc3RfdHlwZWRjYWxsZnNlbmRlclgdcYvx1kHjsGbMe+tr5LZcko13OaRHpW6CMqYQeQI='
};

export const mockLocalCallTime = new Date(Date.parse('2024-10-02T13:18:24.482Z'));

export const mockLocalBlockHeight = 114n;
