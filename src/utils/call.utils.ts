import {IDL} from '@dfinity/candid';
import {RecordClass} from '@dfinity/candid/lib/cjs/idl';
import {IcrcBlob} from '../types/blob';
import {uint8ArrayToBase64} from './base64.utils';

export const encodeArg = <T>({
  recordClass,
  rawArgs
}: {
  recordClass: RecordClass;
  rawArgs: T;
}): IcrcBlob => uint8ArrayToBase64(new Uint8Array(IDL.encode([recordClass], [rawArgs])));
