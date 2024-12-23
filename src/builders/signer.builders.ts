import {encodeIcrcAccount, IcrcTokenMetadata, IcrcTransferArg} from '@dfinity/ledger-icrc';
import {Principal} from '@dfinity/principal';
import {
  arrayOfNumberToUint8Array,
  fromNullable,
  isNullish,
  nonNullish,
  uint8ArrayToHexString
} from '@dfinity/utils';
import {TransferArgs} from '../constants/icrc.idl.constants';
import {SignerBuildersResult} from '../types/signer-builders';
import {formatAmount} from '../utils/format.utils';
import {decodeIdl} from '../utils/idl.utils';

export const buildContentMessageIcrc1Transfer = async ({
  arg,
  owner,
  token: {name: tokenName, decimals: tokenDecimals}
}: {
  arg: ArrayBuffer;
  owner: Principal;
  token: IcrcTokenMetadata;
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
    message.push(`${section(amountLabel)}\n${formatAmount({amount, decimals: tokenDecimals})}`);

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
    message.push(`${section(feeLabel)}\n${fee}`);

    // - Memo
    const nullishMemo = fromNullable(memo);
    if (nonNullish(nullishMemo)) {
      message.push(
        `${section(memoLabel)}\n0x${uint8ArrayToHexString(nullishMemo instanceof Uint8Array ? nullishMemo : arrayOfNumberToUint8Array(nullishMemo))}`
      );
    }

    return {success: true, message: message.join('\n\n')};
  } catch (err: unknown) {
    return {success: false, err};
  }
};
