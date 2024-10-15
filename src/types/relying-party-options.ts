import {z} from 'zod';
import {UrlSchema} from './url';

const ConnectionOptionsSchema = z.object({
  /**
   * Specifies the interval in milliseconds at which the signer is checked (polled) to determine if it is ready.
   *
   * @default 500 - The default polling interval is set to 500 milliseconds.
   */
  pollingIntervalInMilliseconds: z.number().optional(),

  /**
   * Specifies the maximum duration in milliseconds for attempting to establish a connection to the signer.
   * If the connection is not established within this duration, the process will time out.
   *
   * @default 120_000 - The default timeout is set to 120,000 milliseconds (2 minutes).
   */
  timeoutInMilliseconds: z.number().optional()
});

export type ConnectionOptions = z.infer<typeof ConnectionOptionsSchema>;

const WindowOptionsSchema = z.object({
  /**
   * Specifies the position of the signer window.
   */
  position: z.enum(['top-right', 'center']),

  /**
   * Specifies the width of the signer window.
   */
  width: z.number(),

  /**
   * Specifies the height of the signer window.
   */
  height: z.number(),

  /**
   * Optional features for the signer Window object.
   */
  features: z.string().optional()
});

export type WindowOptions = z.infer<typeof WindowOptionsSchema>;

const OnDisconnectSchema = z.function().args().returns(z.void()).optional();

export type OnDisconnect = z.infer<typeof OnDisconnectSchema>;

export const RelyingPartyOptionsSchema = z.object({
  /**
   * The URL of the signer.
   */
  url: UrlSchema,

  /**
   * Optional window options to display the signer, which can be an object of type WindowOptions or a string.
   * If a string is passed, those are applied as-is to the window that is opened (see https://developer.mozilla.org/en-US/docs/Web/API/Window/open#windowfeatures for more information).
   */
  windowOptions: z.union([WindowOptionsSchema, z.string()]).optional(),

  /**
   * The connection options for establishing the connection with the signer.
   */
  connectionOptions: ConnectionOptionsSchema.optional(),

  /**
   * Optional callback function that is triggered when the relying party disconnects from the wallet.
   */
  onDisconnect: OnDisconnectSchema
});

export type RelyingPartyOptions = z.infer<typeof RelyingPartyOptionsSchema>;
