import type {Value} from '../declarations/icrc-1';

export const mockIcrcLedgerMetadata: [string, Value][] = [
  ['icrc1:name', {Text: 'Token'}],
  ['icrc1:symbol', {Text: 'TKN'}],
  ['icrc1:decimals', {Nat: 11n}],
  ['icrc1:fee', {Nat: 12_987n}]
];
