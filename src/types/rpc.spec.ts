import * as z from 'zod';
import {
  JSON_RPC_VERSION_2,
  RpcErrorCode,
  RpcNotificationSchema,
  RpcRequestSchema,
  RpcResponseWithErrorSchema,
  RpcResponseWithResultOrErrorSchema,
  inferRpcRequestWithParamsSchema,
  inferRpcRequestWithoutParamsSchema
} from './rpc';

describe('rpc', () => {
  describe('notification', () => {
    it('should validate a correct RpcNotification', () => {
      const validRpcNotification = {
        jsonrpc: JSON_RPC_VERSION_2,
        method: 'test'
      };

      expect(() => RpcNotificationSchema.parse(validRpcNotification)).not.toThrow();
    });

    it('should validate RpcNotification accept params', () => {
      const validRpcNotification = {
        jsonrpc: JSON_RPC_VERSION_2,
        method: 'test',
        params: {
          hello: 'world'
        }
      };

      expect(() => RpcNotificationSchema.parse(validRpcNotification)).not.toThrow();
    });

    it('should throw if RpcNotification has an id', () => {
      const invalidRpcNotification = {
        jsonrpc: JSON_RPC_VERSION_2,
        id: 1,
        method: 'test'
      };

      expect(() => RpcNotificationSchema.parse(invalidRpcNotification)).toThrow();
    });

    it('should throw if RpcNotification has a no jsonrpc', () => {
      const invalidRpcNotification = {
        method: 'test'
      };

      expect(() => RpcNotificationSchema.parse(invalidRpcNotification)).toThrow();
    });

    it('should throw if RpcNotification has additional fields', () => {
      const invalidRpcNotification = {
        jsonrpc: JSON_RPC_VERSION_2,
        method: 'test',
        hello: 'world'
      };

      expect(() => RpcNotificationSchema.parse(invalidRpcNotification)).toThrow();
    });

    it('should throw if RpcNotification has a no method', () => {
      const invalidRpcNotification = {
        jsonrpc: JSON_RPC_VERSION_2
      };

      expect(() => RpcNotificationSchema.parse(invalidRpcNotification)).toThrow();
    });
  });

  describe('RpcRequest', () => {
    describe('Generic', () => {
      it('should validate a correct RpcRequest', () => {
        const validRpcRequest = {
          jsonrpc: JSON_RPC_VERSION_2,
          id: 1,
          method: 'test'
        };

        expect(() => RpcRequestSchema.parse(validRpcRequest)).not.toThrow();
      });

      it('should throw if RpcRequest has additional fields', () => {
        const invalidRpcRequest = {
          jsonrpc: JSON_RPC_VERSION_2,
          id: 1,
          method: 'test',
          hello: 'world'
        };

        expect(() => RpcRequestSchema.parse(invalidRpcRequest)).toThrow();
      });

      it('should throw if RpcRequest has no id', () => {
        const invalidRpcRequest = {
          jsonrpc: JSON_RPC_VERSION_2,
          method: 'test',
          params: {hello: 123}
        };

        expect(() => RpcRequestSchema.parse(invalidRpcRequest)).toThrow();
      });

      it('should throw if RpcRequest has no jsonrpc', () => {
        const invalidRpcRequest = {
          id: 123,
          method: 'test',
          params: {hello: 123}
        };

        expect(() => RpcRequestSchema.parse(invalidRpcRequest)).toThrow();
      });

      it('should throw if RpcRequest has no method', () => {
        const invalidRpcRequest = {
          jsonrpc: JSON_RPC_VERSION_2,
          id: 123,
          params: {hello: 123}
        };

        expect(() => RpcRequestSchema.parse(invalidRpcRequest)).toThrow();
      });
    });

    describe('Without params', () => {
      const RpcCustomRequest = inferRpcRequestWithoutParamsSchema({method: 'test'});

      it('should validate a correct RpcRequest', () => {
        const validRpcRequest = {
          jsonrpc: JSON_RPC_VERSION_2,
          id: 1,
          method: 'test'
        };

        expect(() => RpcCustomRequest.parse(validRpcRequest)).not.toThrow();
      });

      it('should throw if RpcRequest has additional fields', () => {
        const invalidRpcRequest = {
          jsonrpc: JSON_RPC_VERSION_2,
          id: 1,
          method: 'test',
          hello: 'world'
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

    describe('With params', () => {
      const paramsSchema = z.object({hello: z.string()});
      const RpcCustomRequest = inferRpcRequestWithParamsSchema({
        params: paramsSchema,
        method: 'test'
      });

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

      it('should throw if RpcRequest has invalid method', () => {
        const invalidRpcRequest = {
          jsonrpc: JSON_RPC_VERSION_2,
          id: 1,
          method: 'test-invalid',
          params: {hello: 'world'}
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

  describe('RpcResponse with result or error', () => {
    it('should validate a correct RpcResponse with result', () => {
      const validRpcResponse = {
        jsonrpc: JSON_RPC_VERSION_2,
        id: 1,
        result: {success: true}
      };

      expect(() => RpcResponseWithResultOrErrorSchema.parse(validRpcResponse)).not.toThrow();
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

      expect(() => RpcResponseWithResultOrErrorSchema.parse(validRpcResponse)).not.toThrow();
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

      expect(() => RpcResponseWithResultOrErrorSchema.parse(validRpcResponse)).not.toThrow();
    });

    it('should throw if RpcResponse has neither no result nor error', () => {
      const invalidRpcResponse = {
        jsonrpc: JSON_RPC_VERSION_2,
        id: 1
      };

      expect(() => RpcResponseWithResultOrErrorSchema.parse(invalidRpcResponse)).toThrow(
        'Either result or error should be provided.'
      );
    });

    it('should throw if RpcResponse with result has no id', () => {
      const validRpcResponse = {
        jsonrpc: JSON_RPC_VERSION_2,
        result: {success: true}
      };

      expect(() => RpcResponseWithResultOrErrorSchema.parse(validRpcResponse)).toThrow();
    });

    it('should throw if RpcResponse with error has no id', () => {
      const validRpcResponse = {
        jsonrpc: JSON_RPC_VERSION_2,
        error: {
          code: RpcErrorCode.INTERNAL_ERROR,
          message: 'An internal error occurred'
        }
      };

      expect(() => RpcResponseWithResultOrErrorSchema.parse(validRpcResponse)).toThrow();
    });

    it('should throw if RpcResponse with result has no jsonrpc', () => {
      const validRpcResponse = {
        id: 1,
        result: {success: true}
      };

      expect(() => RpcResponseWithResultOrErrorSchema.parse(validRpcResponse)).toThrow();
    });

    it('should throw if RpcResponse with error has no jsonrpc', () => {
      const validRpcResponse = {
        id: 1,
        error: {
          code: RpcErrorCode.INTERNAL_ERROR,
          message: 'An internal error occurred'
        }
      };

      expect(() => RpcResponseWithResultOrErrorSchema.parse(validRpcResponse)).toThrow();
    });

    it('should throw if RpcResponse has additional fields', () => {
      const invalidRpcResponse = {
        jsonrpc: JSON_RPC_VERSION_2,
        id: 1,
        result: {success: true},
        hello: 'world'
      };

      expect(() => RpcResponseWithResultOrErrorSchema.parse(invalidRpcResponse)).toThrow();
    });
  });

  describe('RpcResponse with error', () => {
    it('should validate a correct RpcResponse with standard error', () => {
      const validRpcResponseWithError = {
        jsonrpc: JSON_RPC_VERSION_2,
        id: 1,
        error: {
          code: RpcErrorCode.INTERNAL_ERROR,
          message: 'An internal error occurred'
        }
      };

      expect(() => RpcResponseWithErrorSchema.parse(validRpcResponseWithError)).not.toThrow();
    });

    it('should validate a correct RpcResponse with custom error code', () => {
      const validRpcResponseWithError = {
        jsonrpc: JSON_RPC_VERSION_2,
        id: 1,
        error: {
          code: 9999,
          message: 'A custom error occurred'
        }
      };

      expect(() => RpcResponseWithErrorSchema.parse(validRpcResponseWithError)).not.toThrow();
    });

    it('should throw if RpcResponse with error has no error code', () => {
      const invalidRpcResponseWithError = {
        jsonrpc: JSON_RPC_VERSION_2,
        id: 1,
        error: {
          message: 'An error occurred without a code'
        }
      };

      expect(() => RpcResponseWithErrorSchema.parse(invalidRpcResponseWithError)).toThrow();
    });

    it('should throw if RpcResponse with error has no error message', () => {
      const invalidRpcResponseWithError = {
        jsonrpc: JSON_RPC_VERSION_2,
        id: 1,
        error: {
          code: RpcErrorCode.INTERNAL_ERROR
        }
      };

      expect(() => RpcResponseWithErrorSchema.parse(invalidRpcResponseWithError)).toThrow();
    });

    it('should throw if RpcResponse with error has no id', () => {
      const invalidRpcResponseWithError = {
        jsonrpc: JSON_RPC_VERSION_2,
        error: {
          code: RpcErrorCode.INTERNAL_ERROR,
          message: 'An internal error occurred'
        }
      };

      expect(() => RpcResponseWithErrorSchema.parse(invalidRpcResponseWithError)).toThrow();
    });

    it('should throw if RpcResponse with error has no jsonrpc field', () => {
      const invalidRpcResponseWithError = {
        id: 1,
        error: {
          code: RpcErrorCode.INTERNAL_ERROR,
          message: 'An internal error occurred'
        }
      };

      expect(() => RpcResponseWithErrorSchema.parse(invalidRpcResponseWithError)).toThrow();
    });

    it('should throw if RpcResponse with error has additional fields', () => {
      const invalidRpcResponseWithError = {
        jsonrpc: JSON_RPC_VERSION_2,
        id: 1,
        error: {
          code: RpcErrorCode.INTERNAL_ERROR,
          message: 'An internal error occurred'
        },
        additionalField: 'not allowed'
      };

      expect(() => RpcResponseWithErrorSchema.parse(invalidRpcResponseWithError)).toThrow();
    });
  });
});
