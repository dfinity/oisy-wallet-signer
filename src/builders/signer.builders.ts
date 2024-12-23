import {encodeIcrcAccount, IcrcTransferArg} from '@dfinity/ledger-icrc';
import {
  arrayOfNumberToUint8Array,
  fromNullable,
  isNullish,
  nonNullish,
  uint8ArrayToHexString
} from '@dfinity/utils';
import {TransferArgs} from '../constants/icrc.idl.constants';
import {icrc21_consent_info} from '../declarations/icrc-21';
import {SignerBuilderFn, SignerBuildersResult} from '../types/signer-builders';
import {formatAmount} from '../utils/format.utils';
import {decodeIdl} from '../utils/idl.utils';

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
