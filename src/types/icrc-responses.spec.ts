import {ICRC25_PERMISSION_GRANTED, ICRC27_ACCOUNTS} from './icrc';
import {
  IcrcReadyResponseSchema,
  IcrcSupportedStandardsResponseSchema,
  IcrcWalletPermissionsResponseSchema,
  IcrcWalletRequestPermissionsResponseSchema,
  type IcrcReadyResponse,
  type IcrcSupportedStandardsResponse
} from './icrc-responses';
import {JSON_RPC_VERSION_2} from './rpc';

describe('icrc-responses', () => {
  const responseSchemas = [
    {icrc: 'icrc25_request_permissions', schema: IcrcWalletRequestPermissionsResponseSchema},
    {icrc: 'icrc25_permissions', schema: IcrcWalletPermissionsResponseSchema}
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

  describe('icrc25_supported_standards', () => {
    const validResponse: IcrcSupportedStandardsResponse = {
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
      expect(() => IcrcSupportedStandardsResponseSchema.parse(validResponse)).not.toThrow();
    });

    it('should throw if response has no valid url', () => {
      const invalidResponse: IcrcSupportedStandardsResponse = {
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
      expect(() => IcrcSupportedStandardsResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('should throw if response has no matching url pattern', () => {
      const invalidResponse: IcrcSupportedStandardsResponse = {
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
      expect(() => IcrcSupportedStandardsResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('should throw if response has no valid url', () => {
      const invalidResponse: IcrcSupportedStandardsResponse = {
        ...validResponse,
        result: {
          supportedStandards: [
            // @ts-expect-error: we are testing this on purpose
            {
              name: 'ICRC-25'
            }
          ]
        }
      };
      expect(() => IcrcSupportedStandardsResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('should throw if response has name not matching URL', () => {
      const invalidResponse: IcrcSupportedStandardsResponse = {
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
      expect(() => IcrcSupportedStandardsResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('should throw if response has no name', () => {
      const invalidResponse: IcrcSupportedStandardsResponse = {
        ...validResponse,
        result: {
          supportedStandards: [
            // @ts-expect-error: we are testing this on purpose
            {
              url: 'https://github.com/dfinity/ICRC/blob/main/ICRCs/ICRC-25/ICRC-25.md'
            }
          ]
        }
      };
      expect(() => IcrcSupportedStandardsResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('should throw if response has no empty supported standards', () => {
      const invalidResponse: IcrcSupportedStandardsResponse = {
        ...validResponse,
        result: {
          supportedStandards: []
        }
      };
      expect(() => IcrcSupportedStandardsResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('should throw if response has no supported standards', () => {
      const {result: _, ...rest} = validResponse;

      const response: IcrcSupportedStandardsResponse = {
        ...rest,
        // @ts-expect-error: we are testing this on purpose
        result: {}
      };

      expect(() => IcrcSupportedStandardsResponseSchema.parse(response)).toThrow();
    });

    it('should throw if response has no result', () => {
      const {result: _, ...rest} = validResponse;

      const response: IcrcSupportedStandardsResponse = rest;

      expect(() => IcrcSupportedStandardsResponseSchema.parse(response)).toThrow();
    });

    it('should throw if response has no id', () => {
      const {id: _, ...rest} = validResponse;

      const response: Partial<IcrcSupportedStandardsResponse> = rest;

      expect(() => IcrcSupportedStandardsResponseSchema.parse(response)).toThrow();
    });

    it('should throw if response has no jsonrpc', () => {
      const {jsonrpc: _, ...rest} = validResponse;

      const response: Partial<IcrcSupportedStandardsResponse> = rest;

      expect(() => IcrcSupportedStandardsResponseSchema.parse(response)).toThrow();
    });
  });

  describe('icrc29_status', () => {
    const validResponse: IcrcReadyResponse = {
      jsonrpc: JSON_RPC_VERSION_2,
      id: 1,
      result: 'ready'
    };

    it('should validate a correct response', () => {
      expect(() => IcrcReadyResponseSchema.parse(validResponse)).not.toThrow();
    });

    it('should throw if response has no valid result string', () => {
      const invalidResponse: IcrcReadyResponse = {
        ...validResponse,
        // @ts-expect-error: we are testing this on purpose
        result: 'test'
      };
      expect(() => IcrcReadyResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('should throw if response has no valid result type', () => {
      const invalidResponse: IcrcReadyResponse = {
        ...validResponse,
        // @ts-expect-error: we are testing this on purpose
        result: {
          hello: 'world'
        }
      };
      expect(() => IcrcReadyResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('should throw if response has no result', () => {
      const {result: _, ...rest} = validResponse;

      const response: IcrcReadyResponse = rest;

      expect(() => IcrcReadyResponseSchema.parse(response)).toThrow();
    });

    it('should throw if response has no id', () => {
      const {id: _, ...rest} = validResponse;

      const response: Partial<IcrcReadyResponse> = rest;

      expect(() => IcrcReadyResponseSchema.parse(response)).toThrow();
    });

    it('should throw if response has no jsonrpc', () => {
      const {jsonrpc: _, ...rest} = validResponse;

      const response: Partial<IcrcReadyResponse> = rest;

      expect(() => IcrcReadyResponseSchema.parse(response)).toThrow();
    });
  });
});
