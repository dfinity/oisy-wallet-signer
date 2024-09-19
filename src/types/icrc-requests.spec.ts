import {ICRC27_ACCOUNTS} from '../constants/icrc.constants';
import {mockCallCanisterParams} from '../mocks/call-canister.mocks';
import {uint8ArrayToBase64} from '../utils/base64.utils';
import {
  IcrcAccountsRequestSchema,
  IcrcCallCanisterRequestParamsSchema,
  IcrcCallCanisterRequestSchema,
  IcrcPermissionsRequestSchema,
  IcrcRequestAnyPermissionsRequestSchema,
  IcrcStatusRequestSchema,
  IcrcSupportedStandardsRequestSchema,
  type IcrcAccountsRequest,
  type IcrcCallCanisterRequest,
  type IcrcPermissionsRequest,
  type IcrcRequestAnyPermissionsRequest
} from './icrc-requests';
import {JSON_RPC_VERSION_2} from './rpc';

describe('icrc-requests', () => {
  describe('icrc25_request_permissions', () => {
    const validRequest: IcrcRequestAnyPermissionsRequest = {
      jsonrpc: JSON_RPC_VERSION_2,
      id: 1,
      method: 'icrc25_request_permissions',
      params: {
        scopes: [
          {
            method: ICRC27_ACCOUNTS
          }
        ]
      }
    };

    it('should validate a correct request', () => {
      expect(() => IcrcRequestAnyPermissionsRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should accept request with "random" method names', () => {
      const randomMethodRequest: IcrcRequestAnyPermissionsRequest = {
        ...validRequest,
        params: {
          scopes: [
            {
              method: 'test'
            }
          ]
        }
      };
      expect(() => IcrcRequestAnyPermissionsRequestSchema.parse(randomMethodRequest)).not.toThrow();
    });

    it('should throw if request has no method', () => {
      const invalidRequest: IcrcRequestAnyPermissionsRequest = {
        ...validRequest,
        params: {
          scopes: []
        }
      };
      expect(() => IcrcRequestAnyPermissionsRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has no scopes', () => {
      const invalidRequest: IcrcRequestAnyPermissionsRequest = {
        ...validRequest,
        // @ts-expect-error: we are testing this on purpose
        params: {}
      };
      expect(() => IcrcRequestAnyPermissionsRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has no params', () => {
      const {params: _, ...rest} = validRequest;

      // @ts-expect-error: we are testing this on purpose
      const invalidRequest: IcrcRequestAnyPermissionsRequest = rest;
      expect(() => IcrcRequestAnyPermissionsRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has invalid method', () => {
      const invalidRequest: IcrcRequestAnyPermissionsRequest = {
        ...validRequest,
        // @ts-expect-error: we are testing this on purpose
        method: 'test'
      };
      expect(() => IcrcRequestAnyPermissionsRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has no id', () => {
      const {id: _, ...rest} = validRequest;

      const invalidRequest: Partial<IcrcRequestAnyPermissionsRequest> = rest;
      expect(() => IcrcRequestAnyPermissionsRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has no jsonrpc', () => {
      const {jsonrpc: _, ...rest} = validRequest;

      const invalidRequest: Partial<IcrcRequestAnyPermissionsRequest> = rest;
      expect(() => IcrcRequestAnyPermissionsRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe('icrc25_permissions', () => {
    const validRequest: IcrcPermissionsRequest = {
      jsonrpc: JSON_RPC_VERSION_2,
      id: 1,
      method: 'icrc25_permissions'
    };

    it('should validate a correct request', () => {
      expect(() => IcrcPermissionsRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should throw if request has params', () => {
      const invalidRequest: IcrcPermissionsRequest = {
        ...validRequest,
        // @ts-expect-error: we are testing this on purpose
        params: {}
      };
      expect(() => IcrcPermissionsRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has invalid method', () => {
      const invalidRequest: IcrcPermissionsRequest = {
        ...validRequest,
        // @ts-expect-error: we are testing this on purpose
        method: 'test'
      };
      expect(() => IcrcPermissionsRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has no id', () => {
      const {id: _, ...rest} = validRequest;

      const invalidRequest: Partial<IcrcPermissionsRequest> = rest;
      expect(() => IcrcPermissionsRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has no jsonrpc', () => {
      const {jsonrpc: _, ...rest} = validRequest;

      const invalidRequest: Partial<IcrcPermissionsRequest> = rest;
      expect(() => IcrcPermissionsRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  const requestWithoutParamsSchemas = [
    {method: 'icrc25_supported_standards', schema: IcrcSupportedStandardsRequestSchema},
    {method: 'icrc29_status', schema: IcrcStatusRequestSchema}
  ];

  describe.each(requestWithoutParamsSchemas)('$method', ({schema, method}) => {
    const validRequest = {
      jsonrpc: JSON_RPC_VERSION_2,
      id: 1,
      method
    };

    it('should validate a correct request', () => {
      expect(() => schema.parse(validRequest)).not.toThrow();
    });

    it('should throw if request has params', () => {
      const invalidRequest = {
        ...validRequest,
        params: {}
      };
      expect(() => schema.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has invalid method', () => {
      const invalidRequest = {
        ...validRequest,
        method: 'test'
      };
      expect(() => schema.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has no id', () => {
      const {id: _, ...rest} = validRequest;

      const invalidRequest = rest;
      expect(() => schema.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has no jsonrpc', () => {
      const {jsonrpc: _, ...rest} = validRequest;

      const invalidRequest = rest;
      expect(() => schema.parse(invalidRequest)).toThrow();
    });
  });

  describe('icrc27_accounts', () => {
    const validRequest: IcrcAccountsRequest = {
      jsonrpc: JSON_RPC_VERSION_2,
      id: 1,
      method: 'icrc27_accounts'
    };

    it('should validate a correct request', () => {
      expect(() => IcrcAccountsRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should throw if request has params', () => {
      const invalidRequest: IcrcAccountsRequest = {
        ...validRequest,
        // @ts-expect-error: we are testing this on purpose
        params: {}
      };
      expect(() => IcrcAccountsRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has invalid method', () => {
      const invalidRequest: IcrcAccountsRequest = {
        ...validRequest,
        // @ts-expect-error: we are testing this on purpose
        method: 'test'
      };
      expect(() => IcrcAccountsRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has no id', () => {
      const {id: _, ...rest} = validRequest;

      const invalidRequest = rest;
      expect(() => IcrcAccountsRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has no jsonrpc', () => {
      const {jsonrpc: _, ...rest} = validRequest;

      const invalidRequest = rest;
      expect(() => IcrcAccountsRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe('icrc49_call_canister', () => {
    const validRequest: IcrcCallCanisterRequest = {
      jsonrpc: JSON_RPC_VERSION_2,
      id: 1,
      method: 'icrc49_call_canister',
      params: mockCallCanisterParams
    };

    it('should validate a correct request', () => {
      expect(() => IcrcCallCanisterRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should fail validation when "canisterId" is invalid', () => {
      const invalidRequest = {
        ...validRequest,
        params: {
          ...validRequest.params,
          canisterId: 'invalid-principal'
        }
      };
      expect(() => IcrcCallCanisterRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should fail validation when "sender" is invalid', () => {
      const invalidRequest = {
        ...validRequest,
        params: {
          ...validRequest.params,
          sender: 'invalid-principal'
        }
      };
      expect(() => IcrcCallCanisterRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should fail validation when "method" is an empty string', () => {
      const invalidRequest = {
        ...validRequest,
        params: {
          ...validRequest.params,
          method: ''
        }
      };
      expect(() => IcrcCallCanisterRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should fail validation when "arg" is not a Uint8Array', () => {
      const invalidRequest = {
        ...validRequest,
        params: {
          ...validRequest.params,
          arg: 'not-a-Uint8Array'
        }
      };
      expect(() => IcrcCallCanisterRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should pass validation when "nonce" is a valid Uint8Array of length <= 32', () => {
      const validMemoRequest = {
        ...validRequest,
        params: {
          ...validRequest.params,
          nonce: uint8ArrayToBase64(new Uint8Array(20))
        }
      };
      expect(() => IcrcCallCanisterRequestSchema.parse(validMemoRequest)).not.toThrow();
    });

    it('should pass validation when "nonce" is a valid Uint8Array of length = 32', () => {
      const validMemoRequest = {
        ...validRequest,
        params: {
          ...validRequest.params,
          nonce: uint8ArrayToBase64(new Uint8Array(32))
        }
      };
      expect(() => IcrcCallCanisterRequestSchema.parse(validMemoRequest)).not.toThrow();
    });

    it('should fail validation when "nonce" exceeds 32 bytes', () => {
      const invalidMemoRequest = {
        ...validRequest,
        params: {
          ...validRequest.params,
          nonce: new Uint8Array(33)
        }
      };
      expect(() => IcrcCallCanisterRequestSchema.parse(invalidMemoRequest)).toThrow();
    });

    it('should fail validation when "params" is missing', () => {
      const {params: _, ...rest} = validRequest;

      const invalidRequest = rest;
      expect(() => IcrcCallCanisterRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should fail validation when "id" is missing', () => {
      const {id: _, ...rest} = validRequest;

      const invalidRequest = {
        ...rest,
        params: validRequest.params
      };
      expect(() => IcrcCallCanisterRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should fail validation when "jsonrpc" is missing', () => {
      const {jsonrpc: _, ...rest} = validRequest;

      const invalidRequest = {
        ...rest,
        params: validRequest.params
      };
      expect(() => IcrcCallCanisterRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should fail validation when "method" is invalid', () => {
      const invalidRequest = {
        ...validRequest,
        method: 'invalid_method'
      };
      expect(() => IcrcCallCanisterRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe('IcrcCallCanisterRequestParamsSchema', () => {
    it('should validate a correct request params', () => {
      expect(() => IcrcCallCanisterRequestParamsSchema.parse(mockCallCanisterParams)).not.toThrow();
    });

    it('should fail validation when "canisterId" is invalid', () => {
      const invalidParams = {
        ...mockCallCanisterParams,
        canisterId: 'invalid-principal'
      };
      expect(() => IcrcCallCanisterRequestParamsSchema.parse(invalidParams)).toThrow();
    });

    it('should fail validation when "sender" is invalid', () => {
      const invalidParams = {
        ...mockCallCanisterParams,
        sender: 'invalid-principal'
      };
      expect(() => IcrcCallCanisterRequestParamsSchema.parse(invalidParams)).toThrow();
    });

    it('should fail validation when "method" is an empty string', () => {
      const invalidParams = {
        ...mockCallCanisterParams,
        method: ''
      };
      expect(() => IcrcCallCanisterRequestParamsSchema.parse(invalidParams)).toThrow();
    });

    it('should fail validation when "arg" is not a Uint8Array', () => {
      const invalidParams = {
        ...mockCallCanisterParams,
        arg: 'not-a-Uint8Array'
      };
      expect(() => IcrcCallCanisterRequestParamsSchema.parse(invalidParams)).toThrow();
    });

    it('should pass validation when "nonce" is a valid Uint8Array of length <= 32', () => {
      const validMemoParams = {
        ...mockCallCanisterParams,
        nonce: uint8ArrayToBase64(new Uint8Array(20))
      };
      expect(() => IcrcCallCanisterRequestParamsSchema.parse(validMemoParams)).not.toThrow();
    });

    it('should pass validation when "nonce" is a valid Uint8Array of length = 32', () => {
      const validMemoParams = {
        ...mockCallCanisterParams,
        nonce: uint8ArrayToBase64(new Uint8Array(32))
      };
      expect(() => IcrcCallCanisterRequestParamsSchema.parse(validMemoParams)).not.toThrow();
    });

    it('should fail validation when "nonce" exceeds 32 bytes', () => {
      const invalidMemoParams = {
        ...mockCallCanisterParams,
        nonce: new Uint8Array(33)
      };
      expect(() => IcrcCallCanisterRequestParamsSchema.parse(invalidMemoParams)).toThrow();
    });

    it('should fail validation when "canisterId" is missing', () => {
      const {canisterId: _, ...rest} = mockCallCanisterParams;

      expect(() => IcrcCallCanisterRequestParamsSchema.parse(rest)).toThrow();
    });

    it('should fail validation when "sender" is missing', () => {
      const {sender: _, ...rest} = mockCallCanisterParams;

      expect(() => IcrcCallCanisterRequestParamsSchema.parse(rest)).toThrow();
    });

    it('should fail validation when "method" is missing', () => {
      const {method: _, ...rest} = mockCallCanisterParams;

      expect(() => IcrcCallCanisterRequestParamsSchema.parse(rest)).toThrow();
    });

    it('should fail validation when "arg" is missing', () => {
      const {arg: _, ...rest} = mockCallCanisterParams;

      expect(() => IcrcCallCanisterRequestParamsSchema.parse(rest)).toThrow();
    });
  });
});
