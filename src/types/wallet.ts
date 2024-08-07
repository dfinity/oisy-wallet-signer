import {z} from 'zod';
import {RpcIdSchema} from './rpc';

const WalletConnectionOptionsSchema = z.object({
  /**
   * Specifies the interval in milliseconds at which the wallet is checked (polled) to determine if it is ready.
   *
   * @default 500 - The default polling interval is set to 500 milliseconds.
   */
  pollingIntervalInMilliseconds: z.number().optional(),

  /**
   * Specifies the maximum duration in milliseconds for attempting to establish a connection to the wallet.
   * If the connection is not established within this duration, the process will time out.
   *
   * @default 120_000 - The default timeout is set to 120,000 milliseconds (2 minutes).
   */
  timeoutInMilliseconds: z.number().optional()
});

const WalletWindowOptionsSchema = z.object({
  /**
   * Specifies the position of the wallet window.
   */
  position: z.enum(['top-right', 'center']),

  /**
   * Specifies the width of the wallet window.
   */
  width: z.number(),

  /**
   * Specifies the height of the wallet window.
   */
  height: z.number(),

  /**
   * Optional features for the wallet Window object.
   */
  features: z.string().optional()
});

export const WalletOptionsSchema = z.object({
  /**
   * The URL of the wallet.
   */
  url: z.string().url(),

  /**
   * Optional window options to display the wallet, which can be an object of type WalletWindowOptions or a string.
   * If a string is passed, those are applied as-is to the window that is opened (see https://developer.mozilla.org/en-US/docs/Web/API/Window/open#windowfeatures for more information).
   */
  windowOptions: z.union([WalletWindowOptionsSchema, z.string()]).optional(),

  /**
   * The connection options for establishing the connection with the wallet.
   */
  connectionOptions: WalletConnectionOptionsSchema.optional()
});

export type WalletConnectionOptions = z.infer<typeof WalletConnectionOptionsSchema>;
export type WalletWindowOptions = z.infer<typeof WalletWindowOptionsSchema>;
export type WalletOptions = z.infer<typeof WalletOptionsSchema>;

export const WalletRequestOptionsSchema = z.object({
  /**
   * A custom identifier for the request, used to correlate responses with their corresponding requests.
   *
   * The wallet is expected to include this ID in its response, ensuring that the response can be accurately matched to the original request.
   *
   * If not provided, the library will generate a unique identifier automatically.
   */
  requestId: RpcIdSchema.optional(),

  /**
   * Specifies the maximum duration in milliseconds for attempting to request an interaction with the wallet.
   * If the wallet does not answer within this duration, the process will time out.
   */
  timeoutInMilliseconds: z.number().optional()
});

export type WalletRequestOptions = z.infer<typeof WalletRequestOptionsSchema>;
