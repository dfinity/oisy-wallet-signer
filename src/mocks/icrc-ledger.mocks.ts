import type {Icrc1Did} from '../declarations';

export const mockIcrcLedgerMetadata: [string, Icrc1Did.Value][] = [
  ['icrc1:name', {Text: 'Token'}],
  ['icrc1:symbol', {Text: 'TKN'}],
  ['icrc1:decimals', {Nat: 11n}],
  ['icrc1:fee', {Nat: 12_987n}]
];
