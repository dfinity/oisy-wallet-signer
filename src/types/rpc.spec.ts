import {describe, expect, it} from 'vitest';
import {z} from 'zod';
import {
  JSON_RPC_VERSION_2,
  RpcErrorCode,
  RpcNotification,
  RpcRequest,
  inferRpcRequest,
  inferRpcResponse
} from './rpc';

describe('rpc', () => {
  describe('notification', () => {
    it('should validate a correct RpcNotification', () => {
      const validRpcNotification = {
        jsonrpc: JSON_RPC_VERSION_2,
        method: 'test'
      };
      expect(() => RpcNotification.parse(validRpcNotification)).not.toThrow();
    });

    it('should validate RpcNotification accept params', () => {
      const validRpcNotification = {
        jsonrpc: JSON_RPC_VERSION_2,
        method: 'test',
        params: {
          hello: 'world'
        }
      };
      expect(() => RpcNotification.parse(validRpcNotification)).not.toThrow();
    });

    it('should throw if RpcNotification has an id', () => {
      const invalidRpcNotification = {
        jsonrpc: JSON_RPC_VERSION_2,
        id: 1,
        method: 'test'
      };

      expect(() => RpcNotification.parse(invalidRpcNotification)).toThrow();
    });

    it('should throw if RpcNotification has a no jsonrpc', () => {
      const invalidRpcNotification = {
        method: 'test'
      };

      expect(() => RpcNotification.parse(invalidRpcNotification)).toThrow();
    });

    it('should throw if RpcNotification has additional fields', () => {
      const invalidRpcNotification = {
        jsonrpc: JSON_RPC_VERSION_2,
        method: 'test',
        hello: 'world'
      };
      expect(() => RpcNotification.parse(invalidRpcNotification)).toThrow();
    });

    it('should throw if RpcNotification has a no method', () => {
      const invalidRpcNotification = {
        jsonrpc: JSON_RPC_VERSION_2
      };

      expect(() => RpcNotification.parse(invalidRpcNotification)).toThrow();
    });
  });

  describe('RpcRequest', () => {
    describe('Without params', () => {
      it('should validate a correct RpcRequest', () => {
        const validRpcRequest = {
          jsonrpc: JSON_RPC_VERSION_2,
          id: 1,
          method: 'test'
        };
        expect(() => RpcRequest.parse(validRpcRequest)).not.toThrow();
      });

      it('should validate a correct RpcRequest with undefined params', () => {
        const validRpcRequest = {
          jsonrpc: JSON_RPC_VERSION_2,
          id: 1,
          method: 'test',
          params: {
            hello: 'world'
          }
        };
        expect(() => RpcRequest.parse(validRpcRequest)).not.toThrow();
      });

      it('should throw if RpcRequest has additional fields', () => {
        const invalidRpcRequest = {
          jsonrpc: JSON_RPC_VERSION_2,
          id: 1,
          method: 'test',
          hello: 'world'
        };
        expect(() => RpcRequest.parse(invalidRpcRequest)).toThrow();
      });

      it('should throw if RpcRequest has no id', () => {
        const invalidRpcRequest = {
          jsonrpc: JSON_RPC_VERSION_2,
          method: 'test',
          params: {hello: 123}
        };
        expect(() => RpcRequest.parse(invalidRpcRequest)).toThrow();
      });

      it('should throw if RpcRequest has no jsonrpc', () => {
        const invalidRpcRequest = {
          id: 123,
          method: 'test',
          params: {hello: 123}
        };
        expect(() => RpcRequest.parse(invalidRpcRequest)).toThrow();
      });

      it('should throw if RpcRequest has no method', () => {
        const invalidRpcRequest = {
          jsonrpc: JSON_RPC_VERSION_2,
          id: 123,
          params: {hello: 123}
        };
        expect(() => RpcRequest.parse(invalidRpcRequest)).toThrow();
      });
    });

    describe('With params', () => {
      const paramsSchema = z.object({hello: z.string()});
      const RpcCustomRequest = inferRpcRequest(paramsSchema);

      it('should validate a correct RpcRequest with custom params', () => {
        const validRpcRequest = {
          jsonrpc: JSON_RPC_VERSION_2,
          id: 1,
          method: 'test',
          params: {hello: 'world'}
        };
        expect(() => RpcCustomRequest.parse(validRpcRequest)).not.toThrow();
      });

      it('should throw if RpcRequest has incorrect custom params', () => {
        const invalidRpcRequest = {
          jsonrpc: JSON_RPC_VERSION_2,
          id: 1,
          method: 'test',
          params: {hello: 123}
        };
        expect(() => RpcCustomRequest.parse(invalidRpcRequest)).toThrow();
      });

      it('should throw if RpcRequest has no custom params', () => {
        const invalidRpcRequest = {
          jsonrpc: JSON_RPC_VERSION_2,
          id: 1,
          method: 'test'
        };
        expect(() => RpcCustomRequest.parse(invalidRpcRequest)).toThrow();
      });

      it('should throw if RpcRequest has no id', () => {
        const invalidRpcRequest = {
          jsonrpc: JSON_RPC_VERSION_2,
          method: 'test',
          params: {hello: 123}
        };
        expect(() => RpcCustomRequest.parse(invalidRpcRequest)).toThrow();
      });

      it('should throw if RpcRequest has no jsonrpc', () => {
        const invalidRpcRequest = {
          id: 123,
          method: 'test',
          params: {hello: 123}
        };
        expect(() => RpcCustomRequest.parse(invalidRpcRequest)).toThrow();
      });

      it('should throw if RpcRequest has no method', () => {
        const invalidRpcRequest = {
          jsonrpc: JSON_RPC_VERSION_2,
          id: 123,
          params: {hello: 123}
        };
        expect(() => RpcCustomRequest.parse(invalidRpcRequest)).toThrow();
      });
    });
  });

  describe('RpcResponse', () => {
    const resultSchema = z.object({success: z.boolean()});
    const RpcResponse = inferRpcResponse(resultSchema);

    it('should validate a correct RpcResponse with result', () => {
      const validRpcResponse = {
        jsonrpc: JSON_RPC_VERSION_2,
        id: 1,
        result: {success: true}
      };
      expect(() => RpcResponse.parse(validRpcResponse)).not.toThrow();
    });

    it('should validate a correct RpcResponse with error', () => {
      const validRpcResponse = {
        jsonrpc: JSON_RPC_VERSION_2,
        id: 1,
        error: {
          code: RpcErrorCode.INTERNAL_ERROR,
          message: 'An internal error occurred'
        }
      };
      expect(() => RpcResponse.parse(validRpcResponse)).not.toThrow();
    });

    it('should validate a correct RpcResponse with application custom error', () => {
      const validRpcResponse = {
        jsonrpc: JSON_RPC_VERSION_2,
        id: 1,
        error: {
          code: 9999,
          message: 'A custom application error occurred'
        }
      };
      expect(() => RpcResponse.parse(validRpcResponse)).not.toThrow();
    });

    it('should throw if RpcResponse has neither no result nor error', () => {
      const invalidRpcResponse = {
        jsonrpc: JSON_RPC_VERSION_2,
        id: 1
      };
      expect(() => RpcResponse.parse(invalidRpcResponse)).toThrow(
        'Either result or error should be provided.'
      );
    });

    it('should throw if RpcResponse with result has no id', () => {
      const validRpcResponse = {
        jsonrpc: JSON_RPC_VERSION_2,
        result: {success: true}
      };
      expect(() => RpcResponse.parse(validRpcResponse)).toThrow();
    });

    it('should throw if RpcResponse with error has no id', () => {
      const validRpcResponse = {
        jsonrpc: JSON_RPC_VERSION_2,
        error: {
          code: RpcErrorCode.INTERNAL_ERROR,
          message: 'An internal error occurred'
        }
      };
      expect(() => RpcResponse.parse(validRpcResponse)).toThrow();
    });

    it('should throw if RpcResponse with result has no jsonrpc', () => {
      const validRpcResponse = {
        id: 1,
        result: {success: true}
      };
      expect(() => RpcResponse.parse(validRpcResponse)).toThrow();
    });

    it('should throw if RpcResponse with error has no jsonrpc', () => {
      const validRpcResponse = {
        id: 1,
        error: {
          code: RpcErrorCode.INTERNAL_ERROR,
          message: 'An internal error occurred'
        }
      };
      expect(() => RpcResponse.parse(validRpcResponse)).toThrow();
    });
  });
});
