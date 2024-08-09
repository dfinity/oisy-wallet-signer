import {ICRC27_ACCOUNTS} from '../constants/icrc.constants';
import {
  IcrcPermissionsRequestSchema,
  IcrcRequestPermissionsRequestSchema,
  IcrcStatusRequestSchema,
  IcrcSupportedStandardsRequestSchema,
  type IcrcPermissionsRequest,
  type IcrcRequestPermissionsRequest
} from './icrc-requests';
import {JSON_RPC_VERSION_2} from './rpc';

describe('icrc-requests', () => {
  describe('icrc25_request_permissions', () => {
    const validRequest: IcrcRequestPermissionsRequest = {
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
      expect(() => IcrcRequestPermissionsRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should throw if request has invalid method', () => {
      const invalidRequest: IcrcRequestPermissionsRequest = {
        ...validRequest,
        params: {
          scopes: [
            {
              // @ts-expect-error: we are testing this on purpose
              method: 'test'
            }
          ]
        }
      };
      expect(() => IcrcRequestPermissionsRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has no method', () => {
      const invalidRequest: IcrcRequestPermissionsRequest = {
        ...validRequest,
        params: {
          scopes: []
        }
      };
      expect(() => IcrcRequestPermissionsRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has no scopes', () => {
      const invalidRequest: IcrcRequestPermissionsRequest = {
        ...validRequest,
        // @ts-expect-error: we are testing this on purpose
        params: {}
      };
      expect(() => IcrcRequestPermissionsRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has no params', () => {
      const {params: _, ...rest} = validRequest;

      // @ts-expect-error: we are testing this on purpose
      const invalidRequest: IcrcRequestPermissionsRequest = rest;
      expect(() => IcrcRequestPermissionsRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has invalid method', () => {
      const invalidRequest: IcrcRequestPermissionsRequest = {
        ...validRequest,
        // @ts-expect-error: we are testing this on purpose
        method: 'test'
      };
      expect(() => IcrcRequestPermissionsRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has no id', () => {
      const {id: _, ...rest} = validRequest;

      const invalidRequest: Partial<IcrcRequestPermissionsRequest> = rest;
      expect(() => IcrcRequestPermissionsRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has no jsonrpc', () => {
      const {jsonrpc: _, ...rest} = validRequest;

      const invalidRequest: Partial<IcrcRequestPermissionsRequest> = rest;
      expect(() => IcrcRequestPermissionsRequestSchema.parse(invalidRequest)).toThrow();
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
});
