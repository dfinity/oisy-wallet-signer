import {IcrcTokenMetadata} from '@dfinity/ledger-icrc';
import {Principal} from '@dfinity/principal';
import {icrc21_consent_info} from '../declarations/icrc-21';

export interface SignerBuildersResultOk {
  Ok: icrc21_consent_info;
}

export interface SignerBuildersResultError {
  Err: unknown;
}

export type SignerBuildersResult = SignerBuildersResultOk | SignerBuildersResultError;

export interface SignerBuilderParams {
  arg: ArrayBuffer;
  owner: Principal;
  token: IcrcTokenMetadata;
}

export type SignerBuilderFn = (params: SignerBuilderParams) => Promise<SignerBuildersResult>;
