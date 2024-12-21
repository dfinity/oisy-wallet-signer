import {mockCallCanisterParams} from '../mocks/call-canister.mocks';
import {mockIcrcLocalCallParams} from '../mocks/icrc-call-utils.mocks';
import {SignerBuildersResultError, SignerBuildersResultSuccess} from '../types/signer-builders';
import {base64ToUint8Array} from '../utils/base64.utils';
import {buildContentMessageIcrc1Transfer} from './signer.builders';

describe('Signer builders', () => {
  describe('icrc1_transfer', () => {
    it('should build a consent message for a defined arg', () => {
      const result = buildContentMessageIcrc1Transfer(
        base64ToUint8Array(mockIcrcLocalCallParams.arg)
      );

      expect(result.success).toBeTruthy();

      const {message} = result as SignerBuildersResultSuccess;

      expect(message).not.toBeUndefined();
      expect(message).toEqual(`# Approve the transfer of funds

**Amount:**
5000000`);
    });

    it('should not build a consent message for invalid arg', () => {
      const result = buildContentMessageIcrc1Transfer(
        base64ToUint8Array(mockCallCanisterParams.arg)
      );

      expect(result.success).toBeFalsy();

      const {err} = result as SignerBuildersResultError;

      expect(err).not.toBeUndefined();
      expect((err as Error).message).toContain('Wrong magic number');
    });
  });
});
