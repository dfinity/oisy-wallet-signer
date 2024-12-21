import {IcrcTransferArg} from '@dfinity/ledger-icrc';
import {TransferArgs} from '../constants/icrc.idl.constants';
import {SignerBuildersResult} from '../types/signer-builders';
import {decodeIdl} from '../utils/idl.utils';

export const buildContentMessageIcrc1Transfer = (arg: ArrayBuffer): SignerBuildersResult => {
  try {
    const result = decodeIdl<IcrcTransferArg>({
      recordClass: TransferArgs,
      bytes: arg
    });

    return {success: true, message: 'TODO'};
  } catch (err: unknown) {
    return {success: false, err};
  }
};
