import {IcrcTransferArg} from '@dfinity/ledger-icrc';
import {TransferArgs} from '../constants/icrc.idl.constants';
import en from '../i18n/en.json';
import {SignerBuildersResult} from '../types/signer-builders';
import {decodeIdl} from '../utils/idl.utils';

export const buildContentMessageIcrc1Transfer = (arg: ArrayBuffer): SignerBuildersResult => {
  try {
    const {amount} = decodeIdl<IcrcTransferArg>({
      recordClass: TransferArgs,
      bytes: arg
    });

    const {
      core: {amount: amountLabel},
      icrc1_transfer: {title}
    } = en;

    const message = [`# ${title}`];

    const section = (text: string): string => `**${text}:**`;

    message.push(`${section(amountLabel)}\n${amount}`);

    return {success: true, message: message.join('\n\n')};
  } catch (err: unknown) {
    return {success: false, err};
  }
};
