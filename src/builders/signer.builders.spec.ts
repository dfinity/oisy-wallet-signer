import {Ed25519KeyIdentity} from '@dfinity/identity';
import {encodeIcrcAccount} from '@dfinity/ledger-icrc';
import {Principal} from '@dfinity/principal';
import {TransferArgs} from '../constants/icrc.idl.constants';
import {TransferArgs as TransferArgsType} from '../declarations/icrc-1';
import {mockCallCanisterParams} from '../mocks/call-canister.mocks';
import {mockPrincipalText} from '../mocks/icrc-accounts.mocks';
import {mockIcrcLocalCallParams} from '../mocks/icrc-call-utils.mocks';
import {SignerBuildersResultError, SignerBuildersResultSuccess} from '../types/signer-builders';
import {base64ToUint8Array} from '../utils/base64.utils';
import {encodeIdl} from '../utils/idl.utils';
import {buildContentMessageIcrc1Transfer} from './signer.builders';

describe('Signer builders', () => {
  const owner = Ed25519KeyIdentity.generate();

  const rawArgs: TransferArgsType = {
    amount: 6660000n,
    created_at_time: [1727696940356000000n],
    fee: [10000n],
    from_subaccount: [],
    memo: [],
    to: {
      owner: Principal.fromText(mockPrincipalText),
      subaccount: []
    }
  };

  describe('icrc1_transfer', () => {
    it('should build a consent message for a defined arg', async () => {
      const result = await buildContentMessageIcrc1Transfer({
        arg: base64ToUint8Array(mockIcrcLocalCallParams.arg),
        owner: Principal.fromText(mockPrincipalText)
      });

      expect(result.success).toBeTruthy();

      const {message} = result as SignerBuildersResultSuccess;

      expect(message).not.toBeUndefined();
      expect(message).toEqual(`# Approve the transfer of funds

**Amount:**
5000000

**From:**
${mockPrincipalText}`);
    });

    it('should build a consent message with a from subaccount', async () => {
      const subaccount = [1, 2, 3];

      const arg = encodeIdl({
        recordClass: TransferArgs,
        rawArgs: {
          ...rawArgs,
          from_subaccount: [subaccount]
        }
      });

      const result = await buildContentMessageIcrc1Transfer({
        arg: base64ToUint8Array(arg),
        owner: owner.getPrincipal()
      });

      expect(result.success).toBeTruthy();

      const {message} = result as SignerBuildersResultSuccess;

      expect(message).not.toBeUndefined();
      expect(message).toEqual(`# Approve the transfer of funds

**Amount:**
${rawArgs.amount}

**From subaccount:**
${encodeIcrcAccount({owner: owner.getPrincipal(), subaccount: subaccount})}`);
    });

    it('should not build a consent message for invalid arg', async () => {
      const result = await buildContentMessageIcrc1Transfer({
        arg: base64ToUint8Array(mockCallCanisterParams.arg),
        owner: owner.getPrincipal()
      });

      expect(result.success).toBeFalsy();

      const {err} = result as SignerBuildersResultError;

      expect(err).not.toBeUndefined();
      expect((err as Error).message).toContain('Wrong magic number');
    });
  });
});
