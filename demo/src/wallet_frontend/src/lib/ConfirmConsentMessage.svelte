<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { Signer } from '@dfinity/oisy-wallet-signer/signer';
	import { isNullish, nonNullish } from '@dfinity/utils';
	import { ICRC27_ACCOUNTS, ICRC49_CALL_CANISTER } from '@dfinity/oisy-wallet-signer';
	import {
		type AccountsConfirmation,
		type AccountsPromptPayload,
		ConsentMessageAnswer,
		type ConsentMessagePrompt,
		type ConsentMessagePromptPayload
	} from '@dfinity/oisy-wallet-signer/types/signer-prompts';
	import { authStore } from '$core/stores/auth.store';
	import type { icrc21_consent_info } from '@dfinity/oisy-wallet-signer/declarations/icrc-21';
    import Button from "$core/components/Button.svelte";

	type Props = {
		signer: Signer | undefined;
	};

	let { signer }: Props = $props();

	let approve: ConsentMessageAnswer | undefined = $state(undefined);
	let reject: ConsentMessageAnswer | undefined = $state(undefined);
	let consentInfo: icrc21_consent_info | undefined = $state(undefined);

	let displayMessage: string | undefined = $derived(
		nonNullish(consentInfo)
			? (consentInfo.consent_message as { GenericDisplayMessage: string }).GenericDisplayMessage
			: undefined
	);

	const resetPrompt = () => {
		approve = undefined;
		reject = undefined;
		consentInfo = undefined;
	};

	$effect(() => {
		if (isNullish(signer)) {
			resetPrompt();
			return;
		}

		signer.register({
			method: ICRC49_CALL_CANISTER,
			prompt: ({
				approve: approveConsent,
				reject: rejectConsent,
				consentInfo: info
			}: ConsentMessagePromptPayload) => {
				approve = approveConsent;
				reject = rejectConsent;
				consentInfo = info;
			}
		});
	});

	const onApprove = () => {
		approve?.();
		resetPrompt();
	};

	const onReject = () => {
		reject?.();
		resetPrompt();
	};
</script>

{#if nonNullish(displayMessage)}
    <p class="font-bold">Consent Message</p>

    <p class="mt-2 mb-4 text-sm" data-tid="consent-message">
        {displayMessage}
    </p>

    <div class="flex">
        <Button type="button" testId="reject-consent-message">Reject</Button>
        <Button type="button" testId="approve-consent-message">Approve</Button>
    </div>
{/if}
