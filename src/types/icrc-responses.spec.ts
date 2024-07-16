import {describe, expect, it} from 'vitest';
import {ICRC25_PERMISSION_GRANTED, ICRC29_STATUS} from './icrc';
import {
  IcrcSupportedStandardsResponse,
  IcrcWalletPermissionsResponse,
  IcrcWalletRequestPermissionsResponse,
  type IcrcSupportedStandardsResponseType
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
              method: ICRC29_STATUS
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
                method: ICRC29_STATUS
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
                method: ICRC29_STATUS
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

  describe('icrc25_supported_standards', () => {
    const validResponse: IcrcSupportedStandardsResponseType = {
      jsonrpc: JSON_RPC_VERSION_2,
      id: 1,
      result: {
        supportedStandards: [
          {
            name: 'ICRC-25',
            url: 'https://github.com/dfinity/ICRC/blob/main/ICRCs/ICRC-25/ICRC-25.md'
          }
        ]
      }
    };

    it('should validate a correct response', () => {
      expect(() => IcrcSupportedStandardsResponse.parse(validResponse)).not.toThrow();
    });

    it('should throw if response has no valid url', () => {
      const invalidResponse: IcrcSupportedStandardsResponseType = {
        ...validResponse,
        result: {
          supportedStandards: [
            {
              name: 'ICRC-25',
              url: 'test'
            }
          ]
        }
      };
      expect(() => IcrcSupportedStandardsResponse.parse(invalidResponse)).toThrow();
    });

    it('should throw if response has no matching url pattern', () => {
      const invalidResponse: IcrcSupportedStandardsResponseType = {
        ...validResponse,
        result: {
          supportedStandards: [
            {
              name: 'ICRC-25',
              url: 'https://test.com'
            }
          ]
        }
      };
      expect(() => IcrcSupportedStandardsResponse.parse(invalidResponse)).toThrow();
    });

    it('should throw if response has no valid url', () => {
      const invalidResponse: IcrcSupportedStandardsResponseType = {
        ...validResponse,
        result: {
          supportedStandards: [
            {
              name: 'ICRC-25'
            }
          ]
        }
      };
      expect(() => IcrcSupportedStandardsResponse.parse(invalidResponse)).toThrow();
    });

    it('should throw if response has name not matching URL', () => {
      const invalidResponse: IcrcSupportedStandardsResponseType = {
        ...validResponse,
        result: {
          supportedStandards: [
            {
              name: 'ICRC-25',
              url: 'https://github.com/dfinity/ICRC/blob/main/ICRCs/ICRC-99/ICRC-99.md'
            }
          ]
        }
      };
      expect(() => IcrcSupportedStandardsResponse.parse(invalidResponse)).toThrow();
    });

    it('should throw if response has no name', () => {
      const invalidResponse: IcrcSupportedStandardsResponseType = {
        ...validResponse,
        result: {
          supportedStandards: [
            {
              url: 'https://github.com/dfinity/ICRC/blob/main/ICRCs/ICRC-25/ICRC-25.md'
            }
          ]
        }
      };
      expect(() => IcrcSupportedStandardsResponse.parse(invalidResponse)).toThrow();
    });

    it('should throw if response has no empty supported standards', () => {
      const invalidResponse: IcrcSupportedStandardsResponseType = {
        ...validResponse,
        result: {
          supportedStandards: []
        }
      };
      expect(() => IcrcSupportedStandardsResponse.parse(invalidResponse)).toThrow();
    });

    it('should throw if response has no supported standards', () => {
      const {result: _, ...rest} = validResponse;

      const response: IcrcSupportedStandardsResponseType = {
        ...rest,
        result: {}
      };

      expect(() => IcrcSupportedStandardsResponse.parse(response)).toThrow();
    });

    it('should throw if response has no result', () => {
      const {result: _, ...rest} = validResponse;

      const response: IcrcSupportedStandardsResponseType = rest;

      expect(() => IcrcSupportedStandardsResponse.parse(response)).toThrow();
    });

    it('should throw if response has no id', () => {
      const {id: _, ...rest} = validResponse;

      const response: Partial<IcrcSupportedStandardsResponseType> = rest;

      expect(() => IcrcSupportedStandardsResponse.parse(response)).toThrow();
    });

    it('should throw if response has no jsonrpc', () => {
      const {jsonrpc: _, ...rest} = validResponse;

      const response: Partial<IcrcSupportedStandardsResponseType> = rest;

      expect(() => IcrcSupportedStandardsResponse.parse(response)).toThrow();
    });
  });
});
