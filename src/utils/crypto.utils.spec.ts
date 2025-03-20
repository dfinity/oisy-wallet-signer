import { describe, it, expect } from 'vitest';
import { generateHash } from './crypto.utils';

describe('generateHash', () => {
  it('should return a 64-character hexadecimal string', async () => {
    const params = { key1: 'value1', key2: 'value2' };
    const hash = await generateHash(params);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it('should produce the same hash regardless of key order', async () => {
    const params1 = { key1: 'value1', key2: 'value2' };
    const params2 = { key2: 'value2', key1: 'value1' };

    const hash1 = await generateHash(params1);
    const hash2 = await generateHash(params2);

    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different inputs', async () => {
    const params1 = { key1: 'value1', key2: 'value2' };
    const params2 = { key1: 'differentValue', key2: 'value2' };

    const hash1 = await generateHash(params1);
    const hash2 = await generateHash(params2);

    expect(hash1).not.toBe(hash2);
  });

  it('should handle an empty object', async () => {
    const params = {};
    const hash = await generateHash(params);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });
});
