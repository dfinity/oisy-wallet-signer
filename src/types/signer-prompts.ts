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

// Prompt for permissions

const PermissionsApprovalSchema = z.function().args(IcrcScopesArraySchema).returns(z.void());

export type PermissionsApproval = z.infer<typeof PermissionsApprovalSchema>;

const PermissionsPromptPayloadSchema = PromptPayloadSchema.extend({
  requestedScopes: IcrcScopesArraySchema,
  approve: PermissionsApprovalSchema
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
 * @param {PermissionsApproval} params.approve - A function to be called by the consumer to confirm (grant or deny) the requested permissions.
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
  approve: AccountsApprovalSchema
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

const ConsentMessageAnswerSchema = z.function().returns(z.void());

export type ConsentMessageAnswer = z.infer<typeof ConsentMessageAnswerSchema>;

const CallCanisterPromptPayloadSchema = PromptPayloadSchema.extend({
  consentInfo: z.custom<icrc21_consent_info>(),
  approve: ConsentMessageAnswerSchema,
  reject: ConsentMessageAnswerSchema
});

export type ConsentMessagePromptPayload = z.infer<typeof CallCanisterPromptPayloadSchema>;

/**
 * A function that is invoked when the signer requires the user - or consumer of the library - to approve or reject a consent message.
 *
 * @param {ConsentMessagePromptPayload} params - An object containing the consent information and functions to handle approval or rejection.
 * @param {icrc21_consent_info} params.consentInfo - An object containing the consent information that needs to be approved or rejected.
 * @param {() => void} params.approve - A function to be called by the consumer to approve the consent message.
 * @param {() => void} params.reject - A function to be called by the consumer to reject the consent message.
 */
export const CallCanisterPromptSchema = z
  .function()
  .args(CallCanisterPromptPayloadSchema)
  .returns(z.void());

export type CallCanisterPrompt = z.infer<typeof CallCanisterPromptSchema>;
