import {z} from 'zod';
import {
  ICRC25_REQUEST_PERMISSIONS,
  ICRC27_ACCOUNTS,
  ICRC49_CALL_CANISTER
} from '../constants/icrc.constants';
import type {icrc21_consent_info} from '../declarations/icrc-21';
import {IcrcAccountsSchema} from './icrc-accounts';
import {IcrcScopesArraySchema} from './icrc-responses';
import {OriginSchema} from './post-message';

export const PromptMethodSchema = z.enum([
  ICRC25_REQUEST_PERMISSIONS,
  ICRC27_ACCOUNTS,
  ICRC49_CALL_CANISTER
]);

export type PromptMethod = z.infer<typeof PromptMethodSchema>;

const PromptPayloadSchema = z.object({
  origin: OriginSchema
});

const RejectionSchema = z.function().returns(z.void());

export type Rejection = z.infer<typeof RejectionSchema>;

// Prompt for permissions

const PermissionsConfirmationSchema = z.function().args(IcrcScopesArraySchema).returns(z.void());

export type PermissionsConfirmation = z.infer<typeof PermissionsConfirmationSchema>;

const PermissionsPromptPayloadSchema = PromptPayloadSchema.extend({
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
 * @param {PermissionsConfirmation} params.confirm - A function to be called by the consumer to confirm (grant or deny) the requested permissions.
 */
export const PermissionsPromptSchema = z
  .function()
  .args(PermissionsPromptPayloadSchema)
  .returns(z.void());

export type PermissionsPrompt = z.infer<typeof PermissionsPromptSchema>;

// Prompt for accounts

const AccountsApprovalSchema = z.function().args(IcrcAccountsSchema).returns(z.void());

export type AccountsApproval = z.infer<typeof AccountsApprovalSchema>;

const AccountsPromptPayloadSchema = PromptPayloadSchema.extend({
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
export const AccountsPromptSchema = z
  .function()
  .args(AccountsPromptPayloadSchema)
  .returns(z.void());

export type AccountsPrompt = z.infer<typeof AccountsPromptSchema>;

// Prompt for call canister

const CallCanisterPromptTypeSchema = z.enum(['consentMessage', 'processing', 'callCanister']);
export type CallCanisterPromptType = z.infer<typeof CallCanisterPromptTypeSchema>;

const ConsentMessageApprovalSchema = z.function().returns(z.void());
export type ConsentMessageApproval = z.infer<typeof ConsentMessageApprovalSchema>;

const ConsentMessagePromptSchema = PromptPayloadSchema.extend({
  type: z.literal(CallCanisterPromptTypeSchema.enum.consentMessage),
  consentInfo: z.custom<icrc21_consent_info>(),
  approve: ConsentMessageApprovalSchema,
  reject: RejectionSchema
});

const ProcessingPromptSchema = PromptPayloadSchema.extend({
  type: z.literal(CallCanisterPromptTypeSchema.enum.processing),
  step: z.enum([
    CallCanisterPromptTypeSchema.enum.consentMessage,
    CallCanisterPromptTypeSchema.enum.callCanister
  ])
});

const CallCanisterResultPromptSchema = PromptPayloadSchema.extend({
  type: z.literal(CallCanisterPromptTypeSchema.enum.callCanister),
  payload: z.object({
    result: z.enum(['success', 'error']),
    details: z.unknown().optional()
  })
});

const CallCanisterPromptPayloadSchema = z.union([
  ConsentMessagePromptSchema,
  ProcessingPromptSchema,
  CallCanisterResultPromptSchema
]);

export type CallCanisterPromptPayload = z.infer<typeof CallCanisterPromptPayloadSchema>;

/**
 * A function that is invoked when the signer requires the user - or consumer of the library - to handle various steps in the consent flow,
 * such as loading a consent message, processing consent, or executing a canister call.
 *
 * This prompt can handle three different types of payloads:
 * - "consentMessage": Presents a consent message for the user to approve or reject.
 * - "processing": Indicates a processing step (e.g., loading or executing a canister call).
 * - "callCanister": Provides the result of the canister call execution.
 *
 * @param {CallCanisterPromptPayload} params - An object containing the current state of the prompt, including consent information, processing steps, or canister call results.
 *
 * ### When `type` is `"consentMessage"`:
 * @param {icrc21_consent_info} params.payload.consentInfo - An object containing the consent information that needs to be approved or rejected.
 * @param {() => void} params.payload.approve - A function to approve the consent message.
 * @param {() => void} params.payload.reject - A function to reject the consent message.
 *
 * ### When `type` is `"processing"`:
 * @param {'consentMessage' | 'callCanister'} params.step - Represents the current step in the process flow that is in progress.
 *
 * ### When `type` is `"callCanister"`:
 * @param {'success' | 'error'} params.payload.result - Indicates whether the canister call succeeded or failed.
 * @param {unknown} [params.payload.details] - Optional details of the canister call result, if applicable.
 *
 * @returns {void} - This function does not return any value.
 */
export const CallCanisterPromptSchema = z
  .function()
  .args(CallCanisterPromptPayloadSchema)
  .returns(z.void());

export type CallCanisterPrompt = z.infer<typeof CallCanisterPromptSchema>;
