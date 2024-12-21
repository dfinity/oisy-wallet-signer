import {encodeIcrcAccount, IcrcTransferArg} from '@dfinity/ledger-icrc';
import {Principal} from '@dfinity/principal';
import {fromNullable, isNullish} from '@dfinity/utils';
import {TransferArgs} from '../constants/icrc.idl.constants';
import {SignerBuildersResult} from '../types/signer-builders';
import {decodeIdl} from '../utils/idl.utils';

export const buildContentMessageIcrc1Transfer = async ({
  arg,
  owner
}: {
  arg: ArrayBuffer;
  owner: Principal;
}): Promise<SignerBuildersResult> => {
  try {
    const {amount, from_subaccount} = decodeIdl<IcrcTransferArg>({
      recordClass: TransferArgs,
      bytes: arg
    });

    // eslint-disable-next-line import/no-relative-parent-imports
    const {default: en} = await import('../i18n/en.json');

    const {
      core: {amount: amountLabel, from},
      icrc1_transfer: {title, from_subaccount: fromSubaccountLabel}
    } = en;

    const message = [`# ${title}`];

    const section = (text: string): string => `**${text}:**`;

    message.push(`${section(amountLabel)}\n${amount}`);

    const fromSubaccount = fromNullable(from_subaccount);
    const fromAccount = encodeIcrcAccount({
      owner,
      subaccount: fromSubaccount
    });
    message.push(
      `${section(isNullish(fromSubaccount) ? from : fromSubaccountLabel)}\n${fromAccount}`
    );

    return {success: true, message: message.join('\n\n')};
  } catch (err: unknown) {
    return {success: false, err};
  }
};
