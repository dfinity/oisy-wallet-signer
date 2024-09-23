<script lang="ts">
	import type { Signer } from '@dfinity/oisy-wallet-signer/signer';
	import { isNullish, nonNullish } from '@dfinity/utils';
	import type { icrc21_consent_info } from '@dfinity/oisy-wallet-signer';
	import {
		type ConsentMessageApproval,
		type ConsentMessagePromptPayload,
		type ResultConsentMessage,
		ICRC21_CALL_CONSENT_MESSAGE,
		type Rejection
	} from '@dfinity/oisy-wallet-signer';
	import Button from '$core/components/Button.svelte';
	import { fade } from 'svelte/transition';

	type Props = {
		signer: Signer | undefined;
	};

	let { signer }: Props = $props();

	let loading = $state<boolean>(false);

	let approve = $state<ConsentMessageApproval | undefined>(undefined);
	let reject = $state<Rejection | undefined>(undefined);
	let consentInfo = $state<icrc21_consent_info | undefined>(undefined);

	let displayMessage: string | undefined = $derived(
		nonNullish(consentInfo)
			? (consentInfo.consent_message as { GenericDisplayMessage: string }).GenericDisplayMessage
			: undefined
	);

	const resetPrompt = () => {
		approve = undefined;
		reject = undefined;
		consentInfo = undefined;
		loading = false;
	};

	$effect(() => {
		if (isNullish(signer)) {
			resetPrompt();
			return;
		}

		signer.register({
			method: ICRC21_CALL_CONSENT_MESSAGE,
			prompt: ({ status, ...rest }: ConsentMessagePromptPayload) => {
				switch (status) {
					case 'result': {
						approve = (rest as ResultConsentMessage).approve;
						reject = (rest as ResultConsentMessage).reject;
						consentInfo = (rest as ResultConsentMessage).consentInfo;
						loading = false;
						break;
					}
					case 'loading': {
						loading = true;
						break;
					}
					default: {
						approve = undefined;
						reject = undefined;
						consentInfo = undefined;
						loading = false;
					}
				}
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

{#if loading || nonNullish(displayMessage)}
	<div in:fade>
		<p class="font-bold text-sm mt-3">Consent Message:</p>

		{#if loading}
			<p data-tid="loading-consent-message" class="text-sm mb-2 break-words">
				Loading consent message...
			</p>
		{/if}

		{#if nonNullish(displayMessage)}
			<p class="text-sm mb-2 break-words" data-tid="consent-message">
				{displayMessage}
			</p>

			<div class="flex">
				<Button type="button" onclick={onReject} testId="reject-consent-message-button"
					>Reject</Button
				>
				<Button type="button" onclick={onApprove} testId="approve-consent-message-button"
					>Approve</Button
				>
			</div>
		{/if}
	</div>
{/if}
