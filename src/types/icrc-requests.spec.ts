import {ICRC27_ACCOUNTS} from '../constants/icrc.constants';
import {
  IcrcWalletPermissionsRequestSchema,
  IcrcWalletRequestPermissionsRequestSchema,
  IcrcWalletStatusRequestSchema,
  IcrcWalletSupportedStandardsRequestSchema,
  type IcrcWalletPermissionsRequest,
  type IcrcWalletRequestPermissionsRequest
} from './icrc-requests';
import {JSON_RPC_VERSION_2} from './rpc';

describe('icrc-requests', () => {
  describe('icrc25_request_permissions', () => {
    const validRequest: IcrcWalletRequestPermissionsRequest = {
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
      expect(() => IcrcWalletRequestPermissionsRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should throw if request has invalid method', () => {
      const invalidRequest: IcrcWalletRequestPermissionsRequest = {
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
      expect(() => IcrcWalletRequestPermissionsRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has no method', () => {
      const invalidRequest: IcrcWalletRequestPermissionsRequest = {
        ...validRequest,
        params: {
          scopes: []
        }
      };
      expect(() => IcrcWalletRequestPermissionsRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has no scopes', () => {
      const invalidRequest: IcrcWalletRequestPermissionsRequest = {
        ...validRequest,
        // @ts-expect-error: we are testing this on purpose
        params: {}
      };
      expect(() => IcrcWalletRequestPermissionsRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has no params', () => {
      const {params: _, ...rest} = validRequest;

      // @ts-expect-error: we are testing this on purpose
      const invalidRequest: IcrcWalletRequestPermissionsRequest = rest;
      expect(() => IcrcWalletRequestPermissionsRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has invalid method', () => {
      const invalidRequest: IcrcWalletRequestPermissionsRequest = {
        ...validRequest,
        // @ts-expect-error: we are testing this on purpose
        method: 'test'
      };
      expect(() => IcrcWalletRequestPermissionsRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has no id', () => {
      const {id: _, ...rest} = validRequest;

      const invalidRequest: Partial<IcrcWalletRequestPermissionsRequest> = rest;
      expect(() => IcrcWalletRequestPermissionsRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has no jsonrpc', () => {
      const {jsonrpc: _, ...rest} = validRequest;

      const invalidRequest: Partial<IcrcWalletRequestPermissionsRequest> = rest;
      expect(() => IcrcWalletRequestPermissionsRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe('icrc25_permissions', () => {
    const validRequest: IcrcWalletPermissionsRequest = {
      jsonrpc: JSON_RPC_VERSION_2,
      id: 1,
      method: 'icrc25_permissions'
    };

    it('should validate a correct request', () => {
      expect(() => IcrcWalletPermissionsRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should throw if request has params', () => {
      const invalidRequest: IcrcWalletPermissionsRequest = {
        ...validRequest,
        // @ts-expect-error: we are testing this on purpose
        params: {}
      };
      expect(() => IcrcWalletPermissionsRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has invalid method', () => {
      const invalidRequest: IcrcWalletPermissionsRequest = {
        ...validRequest,
        // @ts-expect-error: we are testing this on purpose
        method: 'test'
      };
      expect(() => IcrcWalletPermissionsRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has no id', () => {
      const {id: _, ...rest} = validRequest;

      const invalidRequest: Partial<IcrcWalletPermissionsRequest> = rest;
      expect(() => IcrcWalletPermissionsRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has no jsonrpc', () => {
      const {jsonrpc: _, ...rest} = validRequest;

      const invalidRequest: Partial<IcrcWalletPermissionsRequest> = rest;
      expect(() => IcrcWalletPermissionsRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  const requestWithoutParamsSchemas = [
    {method: 'icrc25_supported_standards', schema: IcrcWalletSupportedStandardsRequestSchema},
    {method: 'icrc29_status', schema: IcrcWalletStatusRequestSchema}
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
