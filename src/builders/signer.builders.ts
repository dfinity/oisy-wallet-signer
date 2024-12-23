import {encodeIcrcAccount, type IcrcTransferArg} from '@dfinity/ledger-icrc';
import {
  arrayOfNumberToUint8Array,
  fromNullable,
  isNullish,
  nonNullish,
  uint8ArrayToHexString
} from '@dfinity/utils';
import {TransferArgs} from '../constants/icrc.idl.constants';
import type {icrc21_consent_info} from '../declarations/icrc-21';
import type {SignerBuilderFn, SignerBuildersResult} from '../types/signer-builders';
import {formatAmount} from '../utils/format.utils';
import {decodeIdl} from '../utils/idl.utils';

/**
 * Builds a content message for an ICRC-1 transfer by decoding the arguments for a potential call.
 * This is used as a workaround when the targeted canister does not comply with the ICRC-21 standard — i.e. it has not implemented the related endpoints.
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
  try {
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

    // eslint-disable-next-line import/no-relative-parent-imports
    const {default: en} = await import('../i18n/en.json');

    const {
      core: {amount: amountLabel, from, to, fee: feeLabel, memo: memoLabel},
      icrc1_transfer: {title, from_subaccount: fromSubaccountLabel}
    } = en;

    // Title
    const message = [`# ${title}`];

    const section = (text: string): string => `**${text}:**`;

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
    const nullishMemo = fromNullable(memo);
    if (nonNullish(nullishMemo)) {
      message.push(
        `${section(memoLabel)}\n0x${uint8ArrayToHexString(nullishMemo instanceof Uint8Array ? nullishMemo : arrayOfNumberToUint8Array(nullishMemo))}`
      );
    }

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
