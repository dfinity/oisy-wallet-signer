import {ICRC27_ACCOUNTS} from './icrc';
import {
  IcrcWalletPermissionsRequest,
  IcrcWalletRequestPermissionsRequest,
  IcrcWalletStatusRequest,
  IcrcWalletSupportedStandardsRequest,
  type IcrcWalletPermissionsRequestType,
  type IcrcWalletRequestPermissionsRequestType,
  type IcrcWalletSupportedStandardsRequestType
} from './icrc-requests';
import {JSON_RPC_VERSION_2} from './rpc';

describe('icrc-requests', () => {
  describe('icrc25_request_permissions', () => {
    const validRequest: IcrcWalletRequestPermissionsRequestType = {
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
      expect(() => IcrcWalletRequestPermissionsRequest.parse(validRequest)).not.toThrow();
    });

    it('should throw if request has invalid method', () => {
      const invalidRequest: IcrcWalletRequestPermissionsRequestType = {
        ...validRequest,
        params: {
          scopes: [
            {
              method: 'test'
            }
          ]
        }
      };
      expect(() => IcrcWalletRequestPermissionsRequest.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has no method', () => {
      const invalidRequest: IcrcWalletRequestPermissionsRequestType = {
        ...validRequest,
        params: {
          scopes: []
        }
      };
      expect(() => IcrcWalletRequestPermissionsRequest.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has no scopes', () => {
      const invalidRequest: IcrcWalletRequestPermissionsRequestType = {
        ...validRequest,
        params: {}
      };
      expect(() => IcrcWalletRequestPermissionsRequest.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has no params', () => {
      const {params: _, ...rest} = validRequest;

      const invalidRequest: IcrcWalletRequestPermissionsRequestType = rest;
      expect(() => IcrcWalletRequestPermissionsRequest.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has invalid method', () => {
      const invalidRequest: IcrcWalletRequestPermissionsRequestType = {
        ...validRequest,
        method: 'test'
      };
      expect(() => IcrcWalletRequestPermissionsRequest.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has no id', () => {
      const {id: _, ...rest} = validRequest;

      const invalidRequest: Partial<IcrcWalletRequestPermissionsRequestType> = rest;
      expect(() => IcrcWalletRequestPermissionsRequest.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has no jsonrpc', () => {
      const {jsonrpc: _, ...rest} = validRequest;

      const invalidRequest: Partial<IcrcWalletRequestPermissionsRequestType> = rest;
      expect(() => IcrcWalletRequestPermissionsRequest.parse(invalidRequest)).toThrow();
    });
  });

  describe('icrc25_permissions', () => {
    const validRequest: IcrcWalletPermissionsRequestType = {
      jsonrpc: JSON_RPC_VERSION_2,
      id: 1,
      method: 'icrc25_permissions'
    };

    it('should validate a correct request', () => {
      expect(() => IcrcWalletPermissionsRequest.parse(validRequest)).not.toThrow();
    });

    it('should throw if request has params', () => {
      const invalidRequest: IcrcWalletPermissionsRequestType = {
        ...validRequest,
        params: {}
      };
      expect(() => IcrcWalletPermissionsRequest.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has invalid method', () => {
      const invalidRequest: IcrcWalletPermissionsRequestType = {
        ...validRequest,
        method: 'test'
      };
      expect(() => IcrcWalletPermissionsRequest.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has no id', () => {
      const {id: _, ...rest} = validRequest;

      const invalidRequest: Partial<IcrcWalletPermissionsRequestType> = rest;
      expect(() => IcrcWalletPermissionsRequest.parse(invalidRequest)).toThrow();
    });

    it('should throw if request has no jsonrpc', () => {
      const {jsonrpc: _, ...rest} = validRequest;

      const invalidRequest: Partial<IcrcWalletPermissionsRequestType> = rest;
      expect(() => IcrcWalletPermissionsRequest.parse(invalidRequest)).toThrow();
    });
  });

  const requestWithoutParamsSchemas = [
    {method: 'icrc25_supported_standards', schema: IcrcWalletSupportedStandardsRequest},
    {method: 'icrc29_status', schema: IcrcWalletStatusRequest}
  ];

  describe.each(requestWithoutParamsSchemas)('$method', ({schema, method}) => {
    const validRequest: IcrcWalletSupportedStandardsRequestType = {
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
