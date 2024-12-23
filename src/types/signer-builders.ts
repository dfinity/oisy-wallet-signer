import {IcrcTokenMetadata} from '@dfinity/ledger-icrc';
import {Principal} from '@dfinity/principal';

export interface SignerBuildersResultOk {
  Ok: string;
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

export type SignerBuilderMethods = 'icrc1_transfer' | string;
