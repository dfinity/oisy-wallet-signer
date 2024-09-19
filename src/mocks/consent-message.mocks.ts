import {fromHex} from '@dfinity/agent';
import {arrayBufferToUint8Array} from '@dfinity/utils';
import {encode} from '../agent/agentjs-cbor-copy';
import type {icrc21_consent_info} from '../declarations/icrc-21';
import type {IcrcCallCanisterResult} from '../types/icrc-responses';
import {uint8ArrayToBase64} from '../utils/base64.utils';
import {mockRepliedLocalCertificate} from './custom-http-agent-responses.mocks';
import {mockRequestDetails} from './custom-http-agent.mocks';

export const mockConsentInfo: icrc21_consent_info = {
  consent_message: {GenericDisplayMessage: 'Test Consent Message'},
  metadata: {
    language: 'en',
    utc_offset_minutes: [0]
  }
};

export const mockCanisterCallSuccess: IcrcCallCanisterResult = {
  certificate: uint8ArrayToBase64(
    arrayBufferToUint8Array(encode(fromHex(mockRepliedLocalCertificate)))
  ),
  contentMap: uint8ArrayToBase64(arrayBufferToUint8Array(encode(mockRequestDetails)))
};
