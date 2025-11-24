/* eslint-disable vitest/expect-expect -- This test suite uses functions with nested `expect` statements */
import {asciiStringToByteArray, base64ToUint8Array, fromNullable} from '@dfinity/utils';
import {encodeIcrcAccount} from '@icp-sdk/canisters/ledger/icrc';
import {uint8ToBuf} from '@icp-sdk/core/agent';
import {IDL} from '@icp-sdk/core/candid';
import {Ed25519KeyIdentity} from '@icp-sdk/core/identity';
import {Principal} from '@icp-sdk/core/principal';
import {MAX_CONSENT_MESSAGE_ARG_SIZE_BYTES} from '../constants/signer.builders.constants';
import type {TransferArgs as TransferArgsType} from '../declarations/icrc-1';
// eslint-disable-next-line import/no-relative-parent-imports
import {TransferArgs} from '../declarations/icrc-1.idl';
// eslint-disable-next-line import/no-relative-parent-imports
import {ApproveArgs, TransferFromArgs} from '../declarations/icrc-2.idl';
import {mockCallCanisterParams} from '../mocks/call-canister.mocks';
import {mockPrincipalText} from '../mocks/icrc-accounts.mocks';
import {mockIcrcApproveArg, mockIcrcApproveRawArgs} from '../mocks/icrc-approve.mocks';
import {mockIcrcLocalCallParams} from '../mocks/icrc-call-utils.mocks';
import {
  mockIcrcTransferFromArg,
  mockIcrcTransferFromRawArgs
} from '../mocks/icrc-transfer-from.mocks';
import type {
  SignerBuilderFn,
  SignerBuildersResult,
  SignerBuildersResultError,
  SignerBuildersResultOk
} from '../types/signer-builders';
import {encodeIdl} from '../utils/idl.utils';
import {
  ArgSizeError,
  buildContentMessageIcrc1Transfer,
  buildContentMessageIcrc2Approve,
  buildContentMessageIcrc2TransferFrom
} from './signer.builders';

describe('Signer builders', () => {
  const owner = Ed25519KeyIdentity.generate();

  const token = {
    name: 'Token',
    symbol: 'TKN',
    fee: 10_000n,
    decimals: 8,
    icon: 'a-logo'
  };

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

  const assertArgSize = async (fn: SignerBuilderFn) => {
    const TestArgs = IDL.Record({
      test: IDL.Text
    });

    const arg = encodeIdl({
      recordClass: TestArgs,
      rawArgs: {
        test: [...Array(500)].map(() => 'A').join('')
      }
    });

    const result = await fn({
      arg: uint8ToBuf(base64ToUint8Array(arg)),
      owner: owner.getPrincipal(),
      token
    });

    expect('Err' in result).toBeTruthy();

    const {Err} = result as SignerBuildersResultError;

    expect(Err).toBeInstanceOf(ArgSizeError);
    expect((Err as ArgSizeError).message).toEqual(
      `The argument size is too large. The maximum allowed size is ${MAX_CONSENT_MESSAGE_ARG_SIZE_BYTES} bytes.`
    );
  };

  describe('icrc1_transfer', () => {
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

    it('should build a consent message for a defined arg (without fee)', async () => {
      const result = await buildContentMessageIcrc1Transfer({
        arg: uint8ToBuf(base64ToUint8Array(mockIcrcLocalCallParams.arg)),
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
        arg: uint8ToBuf(base64ToUint8Array(arg)),
        owner: owner.getPrincipal(),
        token
      });

      expect('Ok' in result).toBeTruthy();

      const {Ok} = result as SignerBuildersResultOk;

      expect(Ok.metadata.language).toEqual('en');
    });

    it('should build a consent message with no utc time information', async () => {
      const arg = encodeIdl({
        recordClass: TransferArgs,
        rawArgs
      });

      const result = await buildContentMessageIcrc1Transfer({
        arg: uint8ToBuf(base64ToUint8Array(arg)),
        owner: owner.getPrincipal(),
        token
      });

      expect('Ok' in result).toBeTruthy();

      const {Ok} = result as SignerBuildersResultOk;

      expect(fromNullable(Ok.metadata.utc_offset_minutes)).toBeUndefined();
    });

    it('should build a consent message with a from label even if a subaccount is used', async () => {
      const subaccount = Uint8Array.from([1, 2, 3]);

      const arg = encodeIdl({
        recordClass: TransferArgs,
        rawArgs: {
          ...rawArgs,
          from_subaccount: [subaccount]
        }
      });

      const result = await buildContentMessageIcrc1Transfer({
        arg: uint8ToBuf(base64ToUint8Array(arg)),
        owner: owner.getPrincipal(),
        token
      });

      expectMessage({
        result,
        expectedMessage: `# Approve the transfer of funds

**Amount:**
3,200.00000001 TKN

**From:**
${encodeIcrcAccount({owner: owner.getPrincipal(), subaccount})}

**To:**
${encodeIcrcAccount({owner: rawArgs.to.owner, subaccount: fromNullable(rawArgs.to.subaccount)})}

**Fee:**
0.0010033 TKN`
      });
    });

    it('should build a consent message with a to subaccount', async () => {
      const subaccount = Uint8Array.from([1, 2, 3]);

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
        arg: uint8ToBuf(base64ToUint8Array(arg)),
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
        arg: uint8ToBuf(base64ToUint8Array(arg)),
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
PUPT`
      });
    });

    it('should not build a consent message for invalid arg', async () => {
      const result = await buildContentMessageIcrc1Transfer({
        arg: uint8ToBuf(base64ToUint8Array(mockCallCanisterParams.arg)),
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
        arg: uint8ToBuf(base64ToUint8Array(arg)),
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

    it('should throw error if arg is too long', async () => {
      await assertArgSize(buildContentMessageIcrc1Transfer);
    });
  });

  describe('icrc2_approve', () => {
    it('should build a consent message in english', async () => {
      const result = await buildContentMessageIcrc2Approve({
        arg: uint8ToBuf(base64ToUint8Array(mockIcrcApproveArg)),
        owner: owner.getPrincipal(),
        token
      });

      expect('Ok' in result).toBeTruthy();

      const {Ok} = result as SignerBuildersResultOk;

      expect(Ok.metadata.language).toEqual('en');
    });

    it('should build a consent message with no utc time information', async () => {
      const result = await buildContentMessageIcrc2Approve({
        arg: uint8ToBuf(base64ToUint8Array(mockIcrcApproveArg)),
        owner: owner.getPrincipal(),
        token
      });

      expect('Ok' in result).toBeTruthy();

      const {Ok} = result as SignerBuildersResultOk;

      expect(fromNullable(Ok.metadata.utc_offset_minutes)).toBeUndefined();
    });

    it('should build a consent message for owner', async () => {
      const result = await buildContentMessageIcrc2Approve({
        arg: uint8ToBuf(base64ToUint8Array(mockIcrcApproveArg)),
        owner: owner.getPrincipal(),
        token
      });

      expectMessage({
        result,
        expectedMessage: `# Authorize another address to withdraw from your account

**The following address is allowed to withdraw from your account:**
${encodeIcrcAccount({owner: mockIcrcApproveRawArgs.spender.owner, subaccount: fromNullable(mockIcrcApproveRawArgs.spender.subaccount)})}

**Your account:**
${encodeIcrcAccount({owner: owner.getPrincipal()})}

**Requested withdrawal allowance:**
3,200.00000001 TKN

⚠ The allowance will be set to 3,200.00000001 TKN independently of any previous allowance. Until this transaction has been executed the spender can still exercise the previous allowance (if any) to it's full amount.

**Expiration date:**
No expiration.

**Approval fee:**
0.0010033 TKN

**Transaction fees to be paid by:**
${encodeIcrcAccount({owner: owner.getPrincipal()})}`
      });
    });

    it('should build a consent message with a from subaccount', async () => {
      const subaccount = Uint8Array.from([1, 2, 3]);

      const arg = encodeIdl({
        recordClass: ApproveArgs,
        rawArgs: {
          ...mockIcrcApproveRawArgs,
          from_subaccount: [subaccount]
        }
      });

      const result = await buildContentMessageIcrc2Approve({
        arg: uint8ToBuf(base64ToUint8Array(arg)),
        owner: owner.getPrincipal(),
        token
      });

      expectMessage({
        result,
        expectedMessage: `# Authorize another address to withdraw from your account

**The following address is allowed to withdraw from your account:**
${encodeIcrcAccount({owner: mockIcrcApproveRawArgs.spender.owner, subaccount: fromNullable(mockIcrcApproveRawArgs.spender.subaccount)})}

**Your account:**
${encodeIcrcAccount({owner: owner.getPrincipal(), subaccount})}

**Requested withdrawal allowance:**
3,200.00000001 TKN

⚠ The allowance will be set to 3,200.00000001 TKN independently of any previous allowance. Until this transaction has been executed the spender can still exercise the previous allowance (if any) to it's full amount.

**Expiration date:**
No expiration.

**Approval fee:**
0.0010033 TKN

**Transaction fees to be paid by:**
${encodeIcrcAccount({owner: owner.getPrincipal(), subaccount})}`
      });
    });

    it('should build a consent message with a memo', async () => {
      const memo = asciiStringToByteArray('PUPT'); // Reverse top-up memo

      const arg = encodeIdl({
        recordClass: ApproveArgs,
        rawArgs: {
          ...mockIcrcApproveRawArgs,
          memo: [memo]
        }
      });

      const result = await buildContentMessageIcrc2Approve({
        arg: uint8ToBuf(base64ToUint8Array(arg)),
        owner: owner.getPrincipal(),
        token
      });

      expectMessage({
        result,
        expectedMessage: `# Authorize another address to withdraw from your account

**The following address is allowed to withdraw from your account:**
${encodeIcrcAccount({owner: mockIcrcApproveRawArgs.spender.owner, subaccount: fromNullable(mockIcrcApproveRawArgs.spender.subaccount)})}

**Your account:**
${encodeIcrcAccount({owner: owner.getPrincipal()})}

**Requested withdrawal allowance:**
3,200.00000001 TKN

⚠ The allowance will be set to 3,200.00000001 TKN independently of any previous allowance. Until this transaction has been executed the spender can still exercise the previous allowance (if any) to it's full amount.

**Expiration date:**
No expiration.

**Approval fee:**
0.0010033 TKN

**Transaction fees to be paid by:**
${encodeIcrcAccount({owner: owner.getPrincipal()})}

**Memo:**
PUPT`
      });
    });

    it('should not build a consent message for invalid arg', async () => {
      const result = await buildContentMessageIcrc2Approve({
        arg: uint8ToBuf(base64ToUint8Array(mockCallCanisterParams.arg)),
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
        recordClass: ApproveArgs,
        rawArgs: {
          ...mockIcrcApproveRawArgs,
          fee: []
        }
      });

      const result = await buildContentMessageIcrc2Approve({
        arg: uint8ToBuf(base64ToUint8Array(arg)),
        owner: owner.getPrincipal(),
        token
      });

      expectMessage({
        result,
        expectedMessage: `# Authorize another address to withdraw from your account

**The following address is allowed to withdraw from your account:**
${encodeIcrcAccount({owner: mockIcrcApproveRawArgs.spender.owner, subaccount: fromNullable(mockIcrcApproveRawArgs.spender.subaccount)})}

**Your account:**
${encodeIcrcAccount({owner: owner.getPrincipal()})}

**Requested withdrawal allowance:**
3,200.00000001 TKN

⚠ The allowance will be set to 3,200.00000001 TKN independently of any previous allowance. Until this transaction has been executed the spender can still exercise the previous allowance (if any) to it's full amount.

**Expiration date:**
No expiration.

**Approval fee:**
0.0001 TKN

**Transaction fees to be paid by:**
${encodeIcrcAccount({owner: owner.getPrincipal()})}`
      });
    });

    it('should build a consent message with expected allowance', async () => {
      const expectedAllowance = 1234567n;

      const arg = encodeIdl({
        recordClass: ApproveArgs,
        rawArgs: {
          ...mockIcrcApproveRawArgs,
          expected_allowance: [expectedAllowance]
        }
      });

      const result = await buildContentMessageIcrc2Approve({
        arg: uint8ToBuf(base64ToUint8Array(arg)),
        owner: owner.getPrincipal(),
        token
      });

      expectMessage({
        result,
        expectedMessage: `# Authorize another address to withdraw from your account

**The following address is allowed to withdraw from your account:**
${encodeIcrcAccount({owner: mockIcrcApproveRawArgs.spender.owner, subaccount: fromNullable(mockIcrcApproveRawArgs.spender.subaccount)})}

**Your account:**
${encodeIcrcAccount({owner: owner.getPrincipal()})}

**Requested withdrawal allowance:**
3,200.00000001 TKN

**Current withdrawal allowance:**
0.01234567 TKN

**Expiration date:**
No expiration.

**Approval fee:**
0.0010033 TKN

**Transaction fees to be paid by:**
${encodeIcrcAccount({owner: owner.getPrincipal()})}`
      });
    });

    it('should build a consent message with expires at', async () => {
      const expiresAt = 1735547416200000000n;

      const arg = encodeIdl({
        recordClass: ApproveArgs,
        rawArgs: {
          ...mockIcrcApproveRawArgs,
          expires_at: [expiresAt]
        }
      });

      const result = await buildContentMessageIcrc2Approve({
        arg: uint8ToBuf(base64ToUint8Array(arg)),
        owner: owner.getPrincipal(),
        token
      });

      expectMessage({
        result,
        expectedMessage: `# Authorize another address to withdraw from your account

**The following address is allowed to withdraw from your account:**
${encodeIcrcAccount({owner: mockIcrcApproveRawArgs.spender.owner, subaccount: fromNullable(mockIcrcApproveRawArgs.spender.subaccount)})}

**Your account:**
${encodeIcrcAccount({owner: owner.getPrincipal()})}

**Requested withdrawal allowance:**
3,200.00000001 TKN

⚠ The allowance will be set to 3,200.00000001 TKN independently of any previous allowance. Until this transaction has been executed the spender can still exercise the previous allowance (if any) to it's full amount.

**Expiration date:**
Mon, Dec 30, 2024, 08:30:16 UTC

**Approval fee:**
0.0010033 TKN

**Transaction fees to be paid by:**
${encodeIcrcAccount({owner: owner.getPrincipal()})}`
      });
    });

    it('should throw error if arg is too long', async () => {
      await assertArgSize(buildContentMessageIcrc2Approve);
    });
  });

  describe('icrc2_transfer_from', () => {
    it('should build a consent message in english', async () => {
      const result = await buildContentMessageIcrc2TransferFrom({
        arg: uint8ToBuf(base64ToUint8Array(mockIcrcTransferFromArg)),
        owner: owner.getPrincipal(),
        token
      });

      expect('Ok' in result).toBeTruthy();

      const {Ok} = result as SignerBuildersResultOk;

      expect(Ok.metadata.language).toEqual('en');
    });

    it('should build a consent message with no utc time information', async () => {
      const result = await buildContentMessageIcrc2TransferFrom({
        arg: uint8ToBuf(base64ToUint8Array(mockIcrcTransferFromArg)),
        owner: owner.getPrincipal(),
        token
      });

      expect('Ok' in result).toBeTruthy();

      const {Ok} = result as SignerBuildersResultOk;

      expect(fromNullable(Ok.metadata.utc_offset_minutes)).toBeUndefined();
    });

    it('should build a consent message for owner', async () => {
      const result = await buildContentMessageIcrc2TransferFrom({
        arg: uint8ToBuf(base64ToUint8Array(mockIcrcTransferFromArg)),
        owner: owner.getPrincipal(),
        token
      });

      expectMessage({
        result,
        expectedMessage: `# Transfer from a withdrawal account

**Withdrawal account:**
${encodeIcrcAccount({owner: mockIcrcTransferFromRawArgs.from.owner, subaccount: fromNullable(mockIcrcTransferFromRawArgs.from.subaccount)})}

**Account sending the transfer request:**
${encodeIcrcAccount({owner: owner.getPrincipal()})}

**Amount to withdraw:**
3.20678001 TKN

**To:**
${encodeIcrcAccount({owner: mockIcrcTransferFromRawArgs.to.owner, subaccount: fromNullable(mockIcrcTransferFromRawArgs.to.subaccount)})}

**Fee paid by withdrawal account:**
0.0010044 TKN`
      });
    });

    it('should build a consent message with a spender subaccount', async () => {
      const subaccount = Uint8Array.from([1, 2, 3]);

      const arg = encodeIdl({
        recordClass: TransferFromArgs,
        rawArgs: {
          ...mockIcrcTransferFromRawArgs,
          spender_subaccount: [subaccount]
        }
      });

      const result = await buildContentMessageIcrc2TransferFrom({
        arg: uint8ToBuf(base64ToUint8Array(arg)),
        owner: owner.getPrincipal(),
        token
      });

      expectMessage({
        result,
        expectedMessage: `# Transfer from a withdrawal account

**Withdrawal account:**
${encodeIcrcAccount({owner: mockIcrcTransferFromRawArgs.from.owner, subaccount: fromNullable(mockIcrcTransferFromRawArgs.from.subaccount)})}

**Account sending the transfer request:**
${encodeIcrcAccount({owner: owner.getPrincipal(), subaccount})}

**Amount to withdraw:**
3.20678001 TKN

**To:**
${encodeIcrcAccount({owner: mockIcrcTransferFromRawArgs.to.owner, subaccount: fromNullable(mockIcrcTransferFromRawArgs.to.subaccount)})}

**Fee paid by withdrawal account:**
0.0010044 TKN`
      });
    });

    it('should build a consent message with a from subaccount', async () => {
      const subaccount = Uint8Array.from([1, 2, 3]);

      const arg = encodeIdl({
        recordClass: TransferFromArgs,
        rawArgs: {
          ...mockIcrcTransferFromRawArgs,
          from: {
            owner: mockIcrcTransferFromRawArgs.from.owner,
            subaccount: [subaccount]
          }
        }
      });

      const result = await buildContentMessageIcrc2TransferFrom({
        arg: uint8ToBuf(base64ToUint8Array(arg)),
        owner: owner.getPrincipal(),
        token
      });

      expectMessage({
        result,
        expectedMessage: `# Transfer from a withdrawal account

**Withdrawal account:**
${encodeIcrcAccount({owner: mockIcrcTransferFromRawArgs.from.owner, subaccount})}

**Account sending the transfer request:**
${encodeIcrcAccount({owner: owner.getPrincipal()})}

**Amount to withdraw:**
3.20678001 TKN

**To:**
${encodeIcrcAccount({owner: mockIcrcTransferFromRawArgs.to.owner, subaccount: fromNullable(mockIcrcTransferFromRawArgs.to.subaccount)})}

**Fee paid by withdrawal account:**
0.0010044 TKN`
      });
    });

    it('should build a consent message with a to subaccount', async () => {
      const subaccount = Uint8Array.from([1, 2, 3]);

      const arg = encodeIdl({
        recordClass: TransferFromArgs,
        rawArgs: {
          ...mockIcrcTransferFromRawArgs,
          to: {
            owner: mockIcrcTransferFromRawArgs.to.owner,
            subaccount: [subaccount]
          }
        }
      });

      const result = await buildContentMessageIcrc2TransferFrom({
        arg: uint8ToBuf(base64ToUint8Array(arg)),
        owner: owner.getPrincipal(),
        token
      });

      expectMessage({
        result,
        expectedMessage: `# Transfer from a withdrawal account

**Withdrawal account:**
${encodeIcrcAccount({owner: mockIcrcTransferFromRawArgs.from.owner, subaccount: fromNullable(mockIcrcTransferFromRawArgs.from.subaccount)})}

**Account sending the transfer request:**
${encodeIcrcAccount({owner: owner.getPrincipal()})}

**Amount to withdraw:**
3.20678001 TKN

**To:**
${encodeIcrcAccount({owner: mockIcrcTransferFromRawArgs.to.owner, subaccount})}

**Fee paid by withdrawal account:**
0.0010044 TKN`
      });
    });

    it('should build a consent message with a memo', async () => {
      const memo = asciiStringToByteArray('PUPT'); // Reverse top-up memo

      const arg = encodeIdl({
        recordClass: TransferFromArgs,
        rawArgs: {
          ...mockIcrcTransferFromRawArgs,
          memo: [memo]
        }
      });

      const result = await buildContentMessageIcrc2TransferFrom({
        arg: uint8ToBuf(base64ToUint8Array(arg)),
        owner: owner.getPrincipal(),
        token
      });

      expectMessage({
        result,
        expectedMessage: `# Transfer from a withdrawal account

**Withdrawal account:**
${encodeIcrcAccount({owner: mockIcrcTransferFromRawArgs.from.owner, subaccount: fromNullable(mockIcrcTransferFromRawArgs.from.subaccount)})}

**Account sending the transfer request:**
${encodeIcrcAccount({owner: owner.getPrincipal()})}

**Amount to withdraw:**
3.20678001 TKN

**To:**
${encodeIcrcAccount({owner: mockIcrcTransferFromRawArgs.to.owner, subaccount: fromNullable(mockIcrcTransferFromRawArgs.to.subaccount)})}

**Fee paid by withdrawal account:**
0.0010044 TKN

**Memo:**
PUPT`
      });
    });

    it('should not build a consent message for invalid arg', async () => {
      const result = await buildContentMessageIcrc2TransferFrom({
        arg: uint8ToBuf(base64ToUint8Array(mockCallCanisterParams.arg)),
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
        recordClass: TransferFromArgs,
        rawArgs: {
          ...mockIcrcTransferFromRawArgs,
          fee: []
        }
      });

      const result = await buildContentMessageIcrc2TransferFrom({
        arg: uint8ToBuf(base64ToUint8Array(arg)),
        owner: owner.getPrincipal(),
        token
      });

      expectMessage({
        result,
        expectedMessage: `# Transfer from a withdrawal account

**Withdrawal account:**
${encodeIcrcAccount({owner: mockIcrcTransferFromRawArgs.from.owner, subaccount: fromNullable(mockIcrcTransferFromRawArgs.from.subaccount)})}

**Account sending the transfer request:**
${encodeIcrcAccount({owner: owner.getPrincipal()})}

**Amount to withdraw:**
3.20678001 TKN

**To:**
${encodeIcrcAccount({owner: mockIcrcTransferFromRawArgs.to.owner, subaccount: fromNullable(mockIcrcTransferFromRawArgs.to.subaccount)})}

**Fee paid by withdrawal account:**
0.0001 TKN`
      });
    });

    it('should throw error if arg is too long', async () => {
      await assertArgSize(buildContentMessageIcrc2TransferFrom);
    });
  });
});
