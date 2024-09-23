<script lang="ts">
	import type { Signer } from '@dfinity/oisy-wallet-signer/signer';
	import { isNullish, nonNullish } from '@dfinity/utils';
	import {
		ICRC49_CALL_CANISTER,
		type Rejection,
		type ConsentMessageApproval,
		type ConsentMessagePromptPayload,
		type ConsentMessageResult
	} from '@dfinity/oisy-wallet-signer';
	import type { icrc21_consent_info } from '@dfinity/oisy-wallet-signer';
	import Button from '$core/components/Button.svelte';

	type Props = {
		signer: Signer | undefined;
	};

	let { signer }: Props = $props();

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
	};

	$effect(() => {
		if (isNullish(signer)) {
			resetPrompt();
			return;
		}

		signer.register({
			method: ICRC49_CALL_CANISTER,
			prompt: ({ status, ...rest }: ConsentMessagePromptPayload) => {
				switch (status) {
					case 'result': {
						approve = (rest as ConsentMessageResult).approve;
						reject = (rest as ConsentMessageResult).reject;
						consentInfo = (rest as ConsentMessageResult).consentInfo;
						break;
					}
					default: {
						approve = undefined;
						reject = undefined;
						consentInfo = undefined;
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

{#if nonNullish(displayMessage)}
	<p class="font-bold">Consent Message</p>

	<p class="mt-2 mb-4 text-sm" data-tid="consent-message">
		{displayMessage}
	</p>

	<div class="flex">
		<Button type="button" onclick={onReject} testId="reject-consent-message">Reject</Button>
		<Button type="button" onclick={onApprove} testId="approve-consent-message">Approve</Button>
	</div>
{/if}
