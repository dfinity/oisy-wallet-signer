import {z} from 'zod';

const RelyingPartyConnectionOptionsSchema = z.object({
  /**
   * Specifies the interval in milliseconds at which the relying party is checked (polled) to determine if it is ready.
   *
   * @default 500 - The default polling interval is set to 500 milliseconds.
   */
  pollingIntervalInMilliseconds: z.number().optional(),

  /**
   * Specifies the maximum duration in milliseconds for attempting to establish a connection to the relying party.
   * If the connection is not established within this duration, the process will time out.
   *
   * @default 120_000 - The default timeout is set to 120,000 milliseconds (2 minutes).
   */
  timeoutInMilliseconds: z.number().optional()
});

const RelyingPartyWindowOptionsSchema = z.object({
  /**
   * Specifies the position of the relying party window.
   */
  position: z.enum(['top-right', 'center']),

  /**
   * Specifies the width of the relying party window.
   */
  width: z.number(),

  /**
   * Specifies the height of the relying party window.
   */
  height: z.number(),

  /**
   * Optional features for the relying party Window object.
   */
  features: z.string().optional()
});

export const RelyingPartyOptionsSchema = z.object({
  /**
   * The URL of the relying party.
   */
  url: z.string().url(),

  /**
   * Optional window options to display the relying party, which can be an object of type RelyingPartyWindowOptions or a string.
   * If a string is passed, those are applied as-is to the window that is opened (see https://developer.mozilla.org/en-US/docs/Web/API/Window/open#windowfeatures for more information).
   */
  windowOptions: z.union([RelyingPartyWindowOptionsSchema, z.string()]).optional(),

  /**
   * The connection options for establishing the connection with the relying party.
   */
  connectionOptions: RelyingPartyConnectionOptionsSchema.optional()
});

export type RelyingPartyConnectionOptions = z.infer<typeof RelyingPartyConnectionOptionsSchema>;
export type RelyingPartyWindowOptions = z.infer<typeof RelyingPartyWindowOptionsSchema>;
export type RelyingPartyOptions = z.infer<typeof RelyingPartyOptionsSchema>;
