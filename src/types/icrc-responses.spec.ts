import {describe, expect, it} from 'vitest';
import {ICRC25_PERMISSION_GRANTED, ICRC27_ACCOUNTS} from './icrc';
import {
  IcrcWalletPermissionsResponse,
  IcrcWalletRequestPermissionsResponse
} from './icrc-responses';
import {JSON_RPC_VERSION_2} from './rpc';

describe('icrc-responses', () => {
  const responseSchemas = [
    {icrc: 'icrc25_request_permissions', schema: IcrcWalletRequestPermissionsResponse},
    {icrc: 'icrc25_permissions', schema: IcrcWalletPermissionsResponse}
  ];

  describe.each(responseSchemas)('$icrc', ({schema}) => {
    const validResponse = {
      jsonrpc: JSON_RPC_VERSION_2,
      id: 1,
      result: {
        scopes: [
          {
            scope: {
              method: ICRC27_ACCOUNTS
            },
            state: ICRC25_PERMISSION_GRANTED
          }
        ]
      }
    };

    it('should validate a correct response', () => {
      expect(() => schema.parse(validResponse)).not.toThrow();
    });

    it('should throw if response has no state', () => {
      const invalidResponse = {
        ...validResponse,
        result: {
          scopes: [
            {
              scope: {
                method: ICRC27_ACCOUNTS
              }
            }
          ]
        }
      };
      expect(() => schema.parse(invalidResponse)).toThrow();
    });

    it('should throw if response has invalid state', () => {
      const invalidResponse = {
        ...validResponse,
        result: {
          scopes: [
            {
              scope: {
                method: ICRC27_ACCOUNTS
              },
              state: 'test'
            }
          ]
        }
      };
      expect(() => schema.parse(invalidResponse)).toThrow();
    });

    it('should throw if response has invalid method', () => {
      const invalidResponse = {
        ...validResponse,
        result: {
          scopes: [
            {
              scope: {
                method: 'test'
              },
              state: ICRC25_PERMISSION_GRANTED
            }
          ]
        }
      };
      expect(() => schema.parse(invalidResponse)).toThrow();
    });

    it('should throw if response has no method', () => {
      const invalidResponse = {
        ...validResponse,
        result: {
          scopes: [
            {
              scope: {},
              state: ICRC25_PERMISSION_GRANTED
            }
          ]
        }
      };
      expect(() => schema.parse(invalidResponse)).toThrow();
    });

    it('should throw if response has no scope', () => {
      const invalidResponse = {
        ...validResponse,
        result: {
          scopes: [
            {
              state: ICRC25_PERMISSION_GRANTED
            }
          ]
        }
      };
      expect(() => schema.parse(invalidResponse)).toThrow();
    });

    it('should throw if response has empty scope', () => {
      const invalidResponse = {
        ...validResponse,
        result: {
          scopes: [{}]
        }
      };
      expect(() => schema.parse(invalidResponse)).toThrow();
    });

    it('should throw if response has no scopes', () => {
      const {result: _, ...rest} = validResponse;

      const response = {
        ...rest,
        result: {}
      };

      expect(() => schema.parse(response)).toThrow();
    });

    it('should throw if response has no result', () => {
      const {result: _, ...rest} = validResponse;

      const response = rest;

      expect(() => schema.parse(response)).toThrow();
    });

    it('should throw if response has no id', () => {
      const {id: _, ...rest} = validResponse;

      const response = rest;

      expect(() => schema.parse(response)).toThrow();
    });

    it('should throw if response has no jsonrpc', () => {
      const {jsonrpc: _, ...rest} = validResponse;

      const response = rest;

      expect(() => schema.parse(response)).toThrow();
    });
  });
});
