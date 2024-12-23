import {Ed25519KeyIdentity} from '@dfinity/identity';
import {encodeIcrcAccount} from '@dfinity/ledger-icrc';
import {Principal} from '@dfinity/principal';
import {asciiStringToByteArray, fromNullable} from '@dfinity/utils';
import {TransferArgs} from '../constants/icrc.idl.constants';
import {TransferArgs as TransferArgsType} from '../declarations/icrc-1';
import {mockCallCanisterParams} from '../mocks/call-canister.mocks';
import {mockPrincipalText} from '../mocks/icrc-accounts.mocks';
import {mockIcrcLocalCallParams} from '../mocks/icrc-call-utils.mocks';
import {
  SignerBuildersResult,
  SignerBuildersResultError,
  SignerBuildersResultOk
} from '../types/signer-builders';
import {base64ToUint8Array} from '../utils/base64.utils';
import {encodeIdl} from '../utils/idl.utils';
import {buildContentMessageIcrc1Transfer} from './signer.builders';

describe('Signer builders', () => {
  const owner = Ed25519KeyIdentity.generate();

  const token = {
    name: 'Token',
    symbol: 'TKN',
    fee: 10_000n,
    decimals: 8,
    icon: 'a-logo'
  };

  const rawArgs: TransferArgsType = {
    amount: 320_000_000_001n,
    created_at_time: [1727696940356000000n],
    fee: [100_330n],
    from_subaccount: [],
    memo: [],
    to: {
      owner: Principal.fromText(mockPrincipalText),
      subaccount: []
    }
  };

  describe('icrc1_transfer', () => {
    const expectMessage = ({
      result,
      expectedMessage
    }: {
      result: SignerBuildersResult;
      expectedMessage: string;
    }) => {
      expect('Ok' in result).toBeTruthy();

      const {Ok} = result as SignerBuildersResultOk;

      expect('GenericDisplayMessage' in Ok.consent_message).toBeTruthy();

      const {GenericDisplayMessage: message} = Ok.consent_message as {
        GenericDisplayMessage: string;
      };

      expect(message).toEqual(expectedMessage);
    };

    it('should build a consent message for a defined arg (without fee)', async () => {
      const result = await buildContentMessageIcrc1Transfer({
        arg: base64ToUint8Array(mockIcrcLocalCallParams.arg),
        owner: Principal.fromText(mockPrincipalText),
        token
      });

      expectMessage({
        result,
        expectedMessage: `# Approve the transfer of funds

**Amount:**
0.05 TKN

**From:**
${mockPrincipalText}

**To:**
s3oqv-3j7id-xjhbm-3owbe-fvwly-oso6u-vej6n-bexck-koyu2-bxb6y-wae

**Fee:**
0.0001 TKN`
      });
    });

    it('should build a consent message in english', async () => {
      const arg = encodeIdl({
        recordClass: TransferArgs,
        rawArgs
      });

      const result = await buildContentMessageIcrc1Transfer({
        arg: base64ToUint8Array(arg),
        owner: owner.getPrincipal(),
        token
      });

      expect('Ok' in result);

      const {Ok} = result as SignerBuildersResultOk;

      expect(Ok.metadata.language).toEqual('en');
    });

    it('should build a consent message with no utc time information', async () => {
      const arg = encodeIdl({
        recordClass: TransferArgs,
        rawArgs
      });

      const result = await buildContentMessageIcrc1Transfer({
        arg: base64ToUint8Array(arg),
        owner: owner.getPrincipal(),
        token
      });

      expect('Ok' in result);

      const {Ok} = result as SignerBuildersResultOk;

      expect(fromNullable(Ok.metadata.utc_offset_minutes)).toBeUndefined();
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
        owner: owner.getPrincipal(),
        token
      });

      expectMessage({
        result,
        expectedMessage: `# Approve the transfer of funds

**Amount:**
3,200.00000001 TKN

**From subaccount:**
${encodeIcrcAccount({owner: owner.getPrincipal(), subaccount: subaccount})}

**To:**
${encodeIcrcAccount({owner: rawArgs.to.owner, subaccount: fromNullable(rawArgs.to.subaccount)})}

**Fee:**
0.0010033 TKN`
      });
    });

    it('should build a consent message with a to subaccount', async () => {
      const subaccount = [1, 2, 3];

      const arg = encodeIdl({
        recordClass: TransferArgs,
        rawArgs: {
          ...rawArgs,
          to: {
            ...rawArgs.to,
            subaccount: [subaccount]
          }
        }
      });

      const result = await buildContentMessageIcrc1Transfer({
        arg: base64ToUint8Array(arg),
        owner: owner.getPrincipal(),
        token
      });

      expectMessage({
        result,
        expectedMessage: `# Approve the transfer of funds

**Amount:**
3,200.00000001 TKN

**From:**
${encodeIcrcAccount({owner: owner.getPrincipal()})}

**To:**
${encodeIcrcAccount({owner: rawArgs.to.owner, subaccount})}

**Fee:**
0.0010033 TKN`
      });
    });

    it('should build a consent message with a memo', async () => {
      const memo = asciiStringToByteArray('PUPT'); // Reverse top-up memo

      const arg = encodeIdl({
        recordClass: TransferArgs,
        rawArgs: {
          ...rawArgs,
          memo: [memo]
        }
      });

      const result = await buildContentMessageIcrc1Transfer({
        arg: base64ToUint8Array(arg),
        owner: owner.getPrincipal(),
        token
      });

      expectMessage({
        result,
        expectedMessage: `# Approve the transfer of funds

**Amount:**
3,200.00000001 TKN

**From:**
${encodeIcrcAccount({owner: owner.getPrincipal()})}

**To:**
${encodeIcrcAccount({owner: rawArgs.to.owner, subaccount: fromNullable(rawArgs.to.subaccount)})}

**Fee:**
0.0010033 TKN

**Memo:**
0x50555054`
      });
    });

    it('should not build a consent message for invalid arg', async () => {
      const result = await buildContentMessageIcrc1Transfer({
        arg: base64ToUint8Array(mockCallCanisterParams.arg),
        owner: owner.getPrincipal(),
        token
      });

      expect('Ok' in result).toBeFalsy();

      const {Err: err} = result as SignerBuildersResultError;

      expect(err).not.toBeUndefined();
      expect((err as Error).message).toContain('Wrong magic number');
    });

    it('should build a consent message with token fee if no fee as arg', async () => {
      const arg = encodeIdl({
        recordClass: TransferArgs,
        rawArgs: {
          ...rawArgs,
          fee: []
        }
      });

      const result = await buildContentMessageIcrc1Transfer({
        arg: base64ToUint8Array(arg),
        owner: owner.getPrincipal(),
        token
      });

      expectMessage({
        result,
        expectedMessage: `# Approve the transfer of funds

**Amount:**
3,200.00000001 TKN

**From:**
${encodeIcrcAccount({owner: owner.getPrincipal()})}

**To:**
${encodeIcrcAccount({owner: rawArgs.to.owner, subaccount: fromNullable(rawArgs.to.subaccount)})}

**Fee:**
0.0001 TKN`
      });
    });
  });
});
