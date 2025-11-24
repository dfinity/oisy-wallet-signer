import {encode} from '@dfinity/cbor';
import {hexStringToUint8Array, uint8ArrayToBase64} from '@dfinity/utils';
import type {Icrc21Did} from '../declarations';
import type {IcrcCallCanisterResult} from '../types/icrc-responses';
import {mockRepliedLocalCertificate} from './custom-http-agent-responses.mocks';
import {mockRequestDetails} from './custom-http-agent.mocks';

export const mockConsentInfo: Icrc21Did.icrc21_consent_info = {
  consent_message: {GenericDisplayMessage: 'Test Consent Message'},
  metadata: {
    language: 'en',
    utc_offset_minutes: [0]
  }
};

export const mockCanisterCallSuccess: IcrcCallCanisterResult = {
  certificate: uint8ArrayToBase64(encode(hexStringToUint8Array(mockRepliedLocalCertificate))),
  contentMap: uint8ArrayToBase64(encode(mockRequestDetails))
};
