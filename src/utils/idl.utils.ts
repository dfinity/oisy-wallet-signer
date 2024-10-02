import {IDL} from '@dfinity/candid';
import {RecordClass, VariantClass} from '@dfinity/candid/lib/cjs/idl';
import {isNullish} from '@dfinity/utils';
import {IcrcBlob} from '../types/blob';
import {uint8ArrayToBase64} from './base64.utils';

export const encodeArg = <T>({
  recordClass,
  rawArgs
}: {
  recordClass: RecordClass | VariantClass;
  rawArgs: T;
}): IcrcBlob => uint8ArrayToBase64(new Uint8Array(IDL.encode([recordClass], [rawArgs])));

export const decodeResult = <T>({
  recordClass,
  reply
}: {
  recordClass: RecordClass | VariantClass;
  reply: ArrayBuffer;
}): T => {
  const result = IDL.decode([recordClass], reply);

  if (isNullish(result)) {
    throw new Error('The reply could not be decoded.');
  }

  if (result.length !== 1) {
    throw new Error('More than one object returned. This is unexpected.');
  }

  // We have to use another ugly type cast because IDL.decode does not accept generics. Additionally, the agent-js implementation does not provide any hints, as its decodeReturnValue relies on the type 'any,' which is bad practice.
  const [response] = result as unknown as [T];
  return response;
};
