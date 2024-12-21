export interface SignerBuildersResultSuccess {
  success: true;
  message: string;
}

export interface SignerBuildersResultError {
  success: false;
  err: unknown;
}

export type SignerBuildersResult = SignerBuildersResultSuccess | SignerBuildersResultError;
