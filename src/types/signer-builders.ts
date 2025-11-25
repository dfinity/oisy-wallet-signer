import type {IcrcTokenMetadata} from '@icp-sdk/canisters/ledger/icrc';
import type {Principal} from '@icp-sdk/core/principal';
import type {Icrc21Did} from '../declarations';

export interface SignerBuildersResultOk {
  Ok: Icrc21Did.icrc21_consent_info;
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

export type SignerBuilderMethods =
  | 'icrc1_transfer'
  | 'icrc2_approve'
  | 'icrc2_transfer_from'
  | string;
