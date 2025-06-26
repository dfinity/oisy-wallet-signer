import * as z from 'zod/v4';
import {
  ICRC21_CALL_CONSENT_MESSAGE,
  ICRC25_REQUEST_PERMISSIONS,
  ICRC27_ACCOUNTS,
  ICRC49_CALL_CANISTER
} from '../constants/icrc.constants';
import type {icrc21_consent_info} from '../declarations/icrc-21';
import {IcrcAccountsSchema} from './icrc-accounts';
import {IcrcCallCanisterRequestParamsSchema} from './icrc-requests';
import {IcrcCallCanisterResultSchema, IcrcScopesArraySchema} from './icrc-responses';
import {OriginSchema} from './post-message';

// Exposed for testing purposes
export const PromptMethodSchema = z.enum([
  ICRC21_CALL_CONSENT_MESSAGE,
  ICRC25_REQUEST_PERMISSIONS,
  ICRC27_ACCOUNTS,
  ICRC49_CALL_CANISTER
]);

export interface Prompts {
  [PromptMethodSchema.enum.icrc21_call_consent_message]: ConsentMessagePrompt;
  [PromptMethodSchema.enum.icrc25_request_permissions]: PermissionsPrompt;
  [PromptMethodSchema.enum.icrc27_accounts]: AccountsPrompt;
  [PromptMethodSchema.enum.icrc49_call_canister]: CallCanisterPrompt;
}

export interface RegisterPrompts<T extends keyof Prompts> {
  method: T;
  prompt: Prompts[T];
}

const PayloadOriginSchema = z.object({
  origin: OriginSchema
});

export type PayloadOrigin = z.infer<typeof PayloadOriginSchema>;

const RejectionSchema = z.function({output: z.void()});

export type Rejection = () => void;

const StatusSchema = z.enum(['result', 'error']);

const ErrorSchema = PayloadOriginSchema.extend({
  status: z.literal(StatusSchema.enum.error),
  details: z.unknown().optional()
});

// Prompt for permissions

const PermissionsConfirmationSchema = z.function({input: IcrcScopesArraySchema, output: z.void()});

export type PermissionsConfirmation = (args: z.infer<typeof PermissionsConfirmationSchema>) => void;

const PermissionsPromptPayloadSchema = PayloadOriginSchema.extend({
  requestedScopes: IcrcScopesArraySchema,
  confirm: PermissionsConfirmationSchema
});

export type PermissionsPromptPayload = z.infer<typeof PermissionsPromptPayloadSchema>;

/**
 * A function that is invoked when the signer requires the user to confirm (grant or deny) requested permissions.
 *
 * This function may be triggered in two scenarios:
 * 1. When the relying party explicitly requests permissions.
 * 2. When the relying party attempts to access a feature that requires permissions that have not yet been granted by the user.
 *
 * @param {PermissionsPromptPayload} params - An object containing the requested permissions and a function to confirm them.
 * @param {IcrcScopes[]} params.requestedScopes - An array of IcrcScopes representing the permissions being requested.
 * @param {PermissionsConfirmation} params.confirm - A function to be called by the consumer to confirm (grant or deny) the requested, a subset, or none of the permissions. Skipping a permission is equivalent to preserving its current state.
 */
export const PermissionsPromptSchema = z.function({
  input: z.tuple([PermissionsPromptPayloadSchema]),
  output: z.void()
});

export type PermissionsPrompt = (args: z.infer<typeof PermissionsPromptSchema>) => void;

// Prompt for accounts

const AccountsApprovalSchema = z.function({input: IcrcAccountsSchema, output: z.void()});

export type AccountsApproval = z.infer<typeof AccountsApprovalSchema>;

const AccountsPromptPayloadSchema = PayloadOriginSchema.extend({
  approve: AccountsApprovalSchema,
  reject: RejectionSchema
});

export type AccountsPromptPayload = z.infer<typeof AccountsPromptPayloadSchema>;

/**
 * A function that is invoked when the signer requires the user - or consumer of the library - to confirm (select or reject) accounts.
 *
 * @param {AccountsPromptPayload} params - An object containing a function to confirm the accounts.
 * @param {IcrcAccounts[]} params.approve - A function to be called by the consumer to confirm (select or reject) the provided accounts.
 */
export const AccountsPromptSchema = z.function({
  input: z.tuple([AccountsPromptPayloadSchema]),
  output: z.void()
});

export type AccountsPrompt = (args: z.infer<typeof AccountsPromptSchema>) => void;

// Prompt for consent message

const ConsentMessageApprovalSchema = z.function({output: z.void()});

export type ConsentMessageApproval = () => void;

const LoadingConsentMessageStatusSchema = z.enum(['loading']);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ConsentMessageStatusSchema = LoadingConsentMessageStatusSchema.or(StatusSchema);

export type ConsentMessageStatus = z.infer<typeof ConsentMessageStatusSchema>;

const LoadingConsentMessageSchema = PayloadOriginSchema.extend({
  status: z.literal(LoadingConsentMessageStatusSchema.enum.loading)
});

const ConsentInfoSchema = z.custom<icrc21_consent_info>();

const ConsentInfoOkSchema = z.object({
  Ok: ConsentInfoSchema
});

export type ConsentInfoOk = z.infer<typeof ConsentInfoOkSchema>;

const ConsentInfoWarnSchema = z.object({
  Warn: IcrcCallCanisterRequestParamsSchema.pick({
    canisterId: true,
    method: true,
    arg: true
  }).extend({
    consentInfo: ConsentInfoSchema
  })
});

export type ConsentInfoWarn = z.infer<typeof ConsentInfoWarnSchema>;

const ResultConsentInfoSchema = z.union([ConsentInfoOkSchema, ConsentInfoWarnSchema]);

export type ResultConsentInfo = z.infer<typeof ResultConsentInfoSchema>;

const ResultConsentMessageSchema = PayloadOriginSchema.extend({
  status: z.literal(StatusSchema.enum.result),
  consentInfo: ResultConsentInfoSchema,
  approve: ConsentMessageApprovalSchema,
  reject: RejectionSchema
});

export type ResultConsentMessage = z.infer<typeof ResultConsentMessageSchema>;

const ConsentMessagePromptPayloadSchema = z.union([
  LoadingConsentMessageSchema,
  ResultConsentMessageSchema,
  ErrorSchema
]);

export type ConsentMessagePromptPayload = z.infer<typeof ConsentMessagePromptPayloadSchema>;

/**
 * A function that is invoked when the signer requires the user - or consumer of the library - to approve or reject a consent message.
 *
 * @param {ConsentMessagePromptPayload} params - An object containing the consent information and functions to handle approval or rejection.
 * @param {icrc21_consent_info} params.consentInfo - An object containing the consent information that needs to be approved or rejected.
 * @param {() => void} params.approve - A function to be called by the consumer to approve the consent message.
 * @param {() => void} params.reject - A function to be called by the consumer to reject the consent message.
 */
export const ConsentMessagePromptSchema = z.function({
  input: z.tuple([ConsentMessagePromptPayloadSchema]),
  output: z.void()
});

const TmpSchema = z.union([z.number(), z.string()]);

export type ConsentMessagePrompt = z.infer<typeof ConsentMessagePromptSchema>;

// Prompt for call canister

const ExecutingCallCanisterStatusSchema = z.enum(['executing']);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CallCanisterStatusSchema = ExecutingCallCanisterStatusSchema.or(StatusSchema);

export type CallCanisterStatus = z.infer<typeof CallCanisterStatusSchema>;

const ExecutingCallCanisterSchema = PayloadOriginSchema.extend({
  status: z.literal(ExecutingCallCanisterStatusSchema.enum.executing)
});

const ResultCallCanisterSchema = z.intersection(
  PayloadOriginSchema.extend({
    status: z.literal(StatusSchema.enum.result)
  }),
  IcrcCallCanisterResultSchema
);

const CallCanisterPromptPayloadSchema = z.union([
  ExecutingCallCanisterSchema,
  ResultCallCanisterSchema,
  ErrorSchema
]);

export type CallCanisterPromptPayload = z.infer<typeof CallCanisterPromptPayloadSchema>;

export const CallCanisterPromptSchema = z.function({
  input: z.tuple([CallCanisterPromptPayloadSchema]),
  output: z.void()
});

export type CallCanisterPrompt = (args: z.infer<typeof CallCanisterPromptSchema>) => void;
