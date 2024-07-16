import {describe, expect, it} from 'vitest';
import {ICRC25_PERMISSION_GRANTED, ICRC27_ACCOUNTS} from './icrc';
import {
  IcrcWalletRequestPermissionsResponse,
  type IcrcWalletRequestPermissionsResponseType
} from './icrc-responses';
import {JSON_RPC_VERSION_2} from './rpc';

describe('icrc-responses', () => {
  describe('icrc25_request_permissions', () => {
    const validResponse: IcrcWalletRequestPermissionsResponseType = {
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
      expect(() => IcrcWalletRequestPermissionsResponse.parse(validResponse)).not.toThrow();
    });

    it('should throw if response has no state', () => {
      const invalidResponse: IcrcWalletRequestPermissionsResponseType = {
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
      expect(() => IcrcWalletRequestPermissionsResponse.parse(invalidResponse)).toThrow();
    });

    it('should throw if response has invalid state', () => {
      const invalidResponse: IcrcWalletRequestPermissionsResponseType = {
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
      expect(() => IcrcWalletRequestPermissionsResponse.parse(invalidResponse)).toThrow();
    });

    it('should throw if response has invalid method', () => {
      const invalidResponse: IcrcWalletRequestPermissionsResponseType = {
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
      expect(() => IcrcWalletRequestPermissionsResponse.parse(invalidResponse)).toThrow();
    });

    it('should throw if response has no method', () => {
      const invalidResponse: IcrcWalletRequestPermissionsResponseType = {
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
      expect(() => IcrcWalletRequestPermissionsResponse.parse(invalidResponse)).toThrow();
    });

    it('should throw if response has no scope', () => {
      const invalidResponse: IcrcWalletRequestPermissionsResponseType = {
        ...validResponse,
        result: {
          scopes: [
            {
              state: ICRC25_PERMISSION_GRANTED
            }
          ]
        }
      };
      expect(() => IcrcWalletRequestPermissionsResponse.parse(invalidResponse)).toThrow();
    });

    it('should throw if response has empty scope', () => {
      const invalidResponse: IcrcWalletRequestPermissionsResponseType = {
        ...validResponse,
        result: {
          scopes: [{}]
        }
      };
      expect(() => IcrcWalletRequestPermissionsResponse.parse(invalidResponse)).toThrow();
    });

    it('should throw if response has no scopes', () => {
      const {result: _, ...rest} = validResponse;

      const response: IcrcWalletRequestPermissionsResponseType = {
        ...rest,
        result: {}
      };

      expect(() => IcrcWalletRequestPermissionsResponse.parse(response)).toThrow();
    });

    it('should throw if response has no result', () => {
      const {result: _, ...rest} = validResponse;

      const response: IcrcWalletRequestPermissionsResponseType = rest;

      expect(() => IcrcWalletRequestPermissionsResponse.parse(response)).toThrow();
    });

    it('should throw if response has no id', () => {
      const {id: _, ...rest} = validResponse;

      const response: Partial<IcrcWalletRequestPermissionsResponseType> = rest;

      expect(() => IcrcWalletRequestPermissionsResponse.parse(response)).toThrow();
    });

    it('should throw if response has no jsonrpc', () => {
      const {jsonrpc: _, ...rest} = validResponse;

      const response: Partial<IcrcWalletRequestPermissionsResponseType> = rest;

      expect(() => IcrcWalletRequestPermissionsResponse.parse(response)).toThrow();
    });
  });
});
