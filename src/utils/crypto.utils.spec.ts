import {Expiry, SubmitRequestType} from '@dfinity/agent';
import {Principal} from '@dfinity/principal';
import {describe, expect, it} from 'vitest';
import {mockRequestMethod} from '../mocks/custom-http-agent.mocks';
import {mockCanisterId, mockPrincipalText} from '../mocks/icrc-accounts.mocks';
import {generateHash} from './crypto.utils';

describe('generateHash', () => {
  const hexRegex = /^[0-9a-fA-F]{64}$/;

  it('returns a valid 64-character hex string for basic string params', async () => {
    const params = {key1: 'value1', key2: 'value2'};
    const hash = await generateHash(params);

    expect(hash).toHaveLength(64);
    expect(hash).toMatch(hexRegex);
  });

  it('returns different hashes for different input values', async () => {
    const hashInput1 = {key: 'value1'};
    const hashInput2 = {key: 'value2'};

    const hash1 = await generateHash(hashInput1);
    const hash2 = await generateHash(hashInput2);

    expect(hash1).not.toBe(hash2);
  });

  it('returns the same hash for the same input object', async () => {
    const input = {a: '1', b: '2'};
    const hash1 = await generateHash(input);
    const hash2 = await generateHash(input);

    expect(hash1).toBe(hash2);
  });

  describe('handles complex value types', () => {
    it('handles BigInt values and distinguishes them correctly', async () => {
      const hash1 = await generateHash({amount: 123n});
      const hash2 = await generateHash({amount: 456n});

      expect(hash1).not.toBe(hash2);
      expect(hash1).toMatch(hexRegex);
    });

    it('handles Principal values correctly', async () => {
      const principalA = Principal.fromText('v7iq7-yiaaa-aaaan-qmrtq-cai');
      const principalB = Principal.fromText(
        'ids2f-skxn7-4uwrl-lgtdm-mcv3m-m324f-vjn73-xg6xq-uea7b-37klk-nqe'
      );

      const hashA = await generateHash({user: principalA});
      const hashB = await generateHash({user: principalB});

      expect(hashA).not.toBe(hashB);
      expect(hashA).toMatch(hexRegex);
    });

    it('handles Uint8Array values correctly', async () => {
      const hash = await generateHash({
        key: new Uint8Array([1, 2, 3, 4])
      });

      expect(hash).toMatch(hexRegex);
    });

    it('handles Expiry values safely', async () => {
      const hash = await generateHash({
        expiry: new Expiry(1_000_000)
      });

      expect(hash).toMatch(hexRegex);
    });

    it('handles a combination of all supported types in a single payload', async () => {
      const complexPayload = {
        canister_id: Principal.fromText(mockCanisterId),
        sender: Principal.fromText(mockPrincipalText),
        method_name: mockRequestMethod,
        arg: new Uint8Array([68, 73, 68, 76]),
        nonce: new Uint8Array([1, 2, 3]).buffer,
        ingress_expiry: new Expiry(5 * 60 * 1000),
        request_type: SubmitRequestType.Call
      };

      const hash = await generateHash(complexPayload);
      expect(hash).toMatch(hexRegex);
    });
  });
});
