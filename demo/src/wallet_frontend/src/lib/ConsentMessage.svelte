<script lang="ts">
	import type { Signer } from '@dfinity/oisy-wallet-signer/signer';
	import { isNullish, nonNullish } from '@dfinity/utils';
	import {
		type ConsentMessageApproval,
		type ConsentMessagePromptPayload,
		type ResultConsentMessage,
		type icrc21_consent_info,
		ICRC21_CALL_CONSENT_MESSAGE,
		type Rejection
	} from '@dfinity/oisy-wallet-signer';
	import Button from '$core/components/Button.svelte';
	import Article from '$core/components/Article.svelte';
	import { fade } from 'svelte/transition';
	import Value from '$core/components/Value.svelte';

	type Props = {
		signer: Signer | undefined;
	};

	let { signer }: Props = $props();

	let loading = $state<boolean>(false);

	let approve = $state<ConsentMessageApproval | undefined>(undefined);
	let reject = $state<Rejection | undefined>(undefined);
	let consentInfo = $state<icrc21_consent_info | undefined>(undefined);
	let consentInfoLevel: 'Warning' | 'Ok' | undefined = $state(undefined);

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
						const result = rest as ResultConsentMessage;

						approve = result.approve;
						reject = result.reject;
						consentInfo =
							'Warn' in result.consentInfo
								? result.consentInfo.Warn.consentInfo
								: result.consentInfo.Ok;
						consentInfoLevel = 'Warn' in result.consentInfo ? 'Warning' : 'Ok';

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
		<Article>
			<p class="font-bold">Consent Message:</p>

			{#if loading}
				<p data-tid="loading-consent-message" class="mb-2 break-words">
					Loading consent message...
				</p>
			{/if}

			{#if nonNullish(displayMessage)}
				<p class="mb-2 break-words" data-tid="consent-message">
					{displayMessage}
				</p>

				<Value id="consent-message-level-block" title="Level">
					<span data-tid="consent-message-level">{consentInfoLevel ?? 'Unknown'}</span>
				</Value>

				<div class="flex gap-4">
					<Button type="button" onclick={onReject} testId="reject-consent-message-button"
						>Reject</Button
					>
					<Button type="button" onclick={onApprove} testId="approve-consent-message-button"
						>Approve</Button
					>
				</div>
			{/if}
		</Article>
	</div>
{/if}
