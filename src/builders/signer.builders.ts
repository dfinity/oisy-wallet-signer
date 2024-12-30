import {encodeIcrcAccount} from '@dfinity/ledger-icrc';
import {
  arrayOfNumberToUint8Array,
  fromNullable,
  isNullish,
  nonNullish,
  uint8ArrayToHexString
} from '@dfinity/utils';
import {TransferArgs} from '../constants/icrc-1.idl.constants';
import {ApproveArgs} from '../constants/icrc-2.idl.constants';
import {TransferArgs as IcrcTransferArg} from '../declarations/icrc-1';
import {ApproveArgs as IcrcApproveArgs} from '../declarations/icrc-2';
import type {icrc21_consent_info} from '../declarations/icrc-21';
import {I18n} from '../types/i18n';
import {SignerBuilderFn, SignerBuildersResult} from '../types/signer-builders';
import {formatAmount, formatDate} from '../utils/format.utils';
import {decodeIdl} from '../utils/idl.utils';

/**
 * Builds a content message for an ICRC-1 transfer by decoding the arguments for a potential call.
 * This is used as a workaround when the targeted canister does not comply with the ICRC-21 standard — i.e. it has not implemented the related endpoints.
 *
 * The implementation is similar to the Markdown generated by the ICRC ledger implementation.
 * @link https://github.com/dfinity/ic/blob/master/packages/icrc-ledger-types/src/icrc21/lib.rs#L153
 *
 * @param {Object} params - Parameters for building the consent message.
 * @param {Uint8Array} params.arg - Encoded arguments for the ICRC-1 transfer.
 * @param {Principal} params.owner - Principal ID of the sender (owner) account.
 * @param {Object} params.token - Token metadata including symbol, decimals, and fee.
 * @param {string} params.token.symbol - The symbol of the token.
 * @param {number} params.token.decimals - The number of decimals for the token.
 * @param {bigint} params.token.fee - Default fee for the token transfer.
 * @returns {Promise<SignerBuildersResult>} - A result containing either the consent message or an error.
 *
 **/
export const buildContentMessageIcrc1Transfer: SignerBuilderFn = async ({
  arg,
  owner,
  token: {symbol: tokenSymbol, decimals: tokenDecimals, fee: tokenFee}
}): Promise<SignerBuildersResult> => {
  const build = (en: I18n): {message: string[]} => {
    const {
      amount,
      from_subaccount: fromSubaccount,
      to: {owner: toOwner, subaccount: toSubaccount},
      fee,
      memo
    } = decodeIdl<IcrcTransferArg>({
      recordClass: TransferArgs,
      bytes: arg
    });

    const {
      core: {amount: amountLabel, from, to, fee: feeLabel},
      icrc1_transfer: {title, from_subaccount: fromSubaccountLabel}
    } = en;

    // Title
    const message = [`# ${title}`];

    // - Amount
    message.push(
      `${section(amountLabel)}\n${formatAmount({amount, decimals: tokenDecimals})} ${tokenSymbol}`
    );

    // - From
    const fromNullishSubaccount = fromNullable(fromSubaccount);
    const fromAccount = encodeIcrcAccount({
      owner,
      subaccount: fromNullishSubaccount
    });
    message.push(
      `${section(isNullish(fromNullishSubaccount) ? from : fromSubaccountLabel)}\n${fromAccount}`
    );

    // - To
    const toAccount = encodeIcrcAccount({
      owner: toOwner,
      subaccount: fromNullable(toSubaccount)
    });
    message.push(`${section(to)}\n${toAccount}`);

    // - Fee
    message.push(
      `${section(feeLabel)}\n${formatAmount({amount: fromNullable(fee) ?? tokenFee, decimals: tokenDecimals})} ${tokenSymbol}`
    );

    // - Memo
    const memoMessage = buildMemo({
      memo,
      en
    });

    return {message: [...message, ...memoMessage]};
  };

  return await buildContentMessage(build);
};

/**
 * Builds a content message for an ICRC-2 Approve by decoding the arguments for a potential call.
 * This is used as a workaround when the targeted canister does not comply with the ICRC-21 standard — i.e. it has not implemented the related endpoints.
 *
 * The implementation is similar to the Markdown generated by the ICRC ledger implementation.
 * @link https://github.com/dfinity/ic/blob/master/packages/icrc-ledger-types/src/icrc21/lib.rs#L194
 *
 * @param {Object} params - Parameters for building the consent message.
 * @param {Uint8Array} params.arg - Encoded arguments for the ICRC-1 transfer.
 * @param {Principal} params.owner - Principal ID of the sender (owner) account.
 * @param {Object} params.token - Token metadata including symbol, decimals, and fee.
 * @param {string} params.token.symbol - The symbol of the token.
 * @param {number} params.token.decimals - The number of decimals for the token.
 * @param {bigint} params.token.fee - Default fee for the token transfer.
 * @returns {Promise<SignerBuildersResult>} - A result containing either the consent message or an error.
 *
 **/
export const buildContentMessageIcrc2Approve: SignerBuilderFn = async ({
  arg,
  owner,
  token: {symbol: tokenSymbol, decimals: tokenDecimals}
}): Promise<SignerBuildersResult> => {
  const build = (en: I18n): {message: string[]} => {
    const {
      spender: {owner: spenderOwner, subaccount: spenderSubaccount},
      from_subaccount: fromSubaccount,
      amount,
      expected_allowance,
      expires_at,
      fee: approveFee,
      memo
    } = decodeIdl<IcrcApproveArgs>({
      recordClass: ApproveArgs,
      bytes: arg
    });

    const {
      icrc2_approve: {
        title,
        address_is_allowed,
        your_account,
        your_subaccount,
        requested_withdrawal_allowance,
        withdrawal_allowance: {none: withdrawalAllowanceNone, some: withdrawalAllowanceSome},
        expiration_date,
        approval_fee,
        approver_account_transaction_fees: {
          subaccount: approverFeeSubaccount,
          owner: approverFeeOwner
        }
      }
    } = en;

    // Title
    const message = [`# ${title}`];

    // - Spender
    const spenderAccount = encodeIcrcAccount({
      owner: spenderOwner,
      subaccount: fromNullable(spenderSubaccount)
    });
    message.push(`${section(address_is_allowed)}\n${spenderAccount}`);

    // - Approver
    const fromNullishSubaccount = fromNullable(fromSubaccount);
    const fromAccount = encodeIcrcAccount({
      owner,
      subaccount: fromNullishSubaccount
    });
    message.push(
      `${section(isNullish(fromNullishSubaccount) ? your_account : your_subaccount)}\n${fromAccount}`
    );

    // - Amount
    message.push(
      `${section(requested_withdrawal_allowance)}\n${formatAmount({amount, decimals: tokenDecimals})} ${tokenSymbol}`
    );

    // - Expected allowance
    const expectedAllowance = fromNullable(expected_allowance);
    if (nonNullish(expectedAllowance)) {
      message.push(
        `${section(withdrawalAllowanceSome)}\n${formatAmount({amount: expectedAllowance, decimals: tokenDecimals})} ${tokenSymbol}`
      );
    } else {
      message.push(
        `⚠️  ${withdrawalAllowanceNone
          .replace('{0}', formatAmount({amount, decimals: tokenDecimals}))
          .replace('{1}', tokenSymbol)}`
      );
    }

    // - Expires at
    const expiresAt = fromNullable(expires_at);
    if (nonNullish(expiresAt)) {
      message.push(`${section(expiration_date)}\n${formatDate(expiresAt)}`);
    }

    // - Fee
    const fee = fromNullable(approveFee);
    if (nonNullish(fee)) {
      message.push(
        `${section(approval_fee)}\n${formatAmount({amount: fee, decimals: tokenDecimals})} ${tokenSymbol}`
      );
    }

    // - Fee paid by
    message.push(
      `${section(isNullish(fromNullishSubaccount) ? approverFeeOwner : approverFeeSubaccount)}\n${fromAccount}`
    );

    // - Memo
    const memoMessage = buildMemo({
      memo,
      en
    });

    return {message: [...message, ...memoMessage]};
  };

  return await buildContentMessage(build);
};

const section = (text: string): string => `**${text}:**`;

const buildMemo = ({memo, en}: {memo: [] | [Uint8Array | number[]]; en: I18n}): [] | [string] => {
  const nullishMemo = fromNullable(memo);

  if (isNullish(nullishMemo)) {
    return [];
  }

  const {
    core: {memo: memoLabel}
  } = en;

  return [
    `${section(memoLabel)}\n0x${uint8ArrayToHexString(nullishMemo instanceof Uint8Array ? nullishMemo : arrayOfNumberToUint8Array(nullishMemo))}`
  ];
};

const buildContentMessage = async (
  fn: (en: I18n) => {message: string[]}
): Promise<SignerBuildersResult> => {
  try {
    // TODO: support i18n
    // eslint-disable-next-line import/no-relative-parent-imports
    const {default: en} = await import('../i18n/en.json');

    const {message} = fn(en);

    const consentMessage: icrc21_consent_info = {
      metadata: {
        language: 'en',
        utc_offset_minutes: []
      },
      consent_message: {
        GenericDisplayMessage: message.join('\n\n')
      }
    };

    return {Ok: consentMessage};
  } catch (err: unknown) {
    return {Err: err};
  }
};
