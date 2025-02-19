<script lang="ts">
	import {
		type CallCanisterPromptPayload,
		ICRC49_CALL_CANISTER,
		type CallCanisterStatus
	} from '@dfinity/oisy-wallet-signer';
	import type { Signer } from '@dfinity/oisy-wallet-signer/signer';
	import { isNullish, nonNullish } from '@dfinity/utils';
	import { fade } from 'svelte/transition';
	import { emit } from '$core/utils/events.utils';

	interface Props {
		signer: Signer | undefined;
	}

	let { signer }: Props = $props();

	let status = $state<CallCanisterStatus | undefined>(undefined);

	$effect(() => {
		if (isNullish(signer)) {
			status = undefined;
			return;
		}

		signer.register({
			method: ICRC49_CALL_CANISTER,
			prompt: ({ status: s }: CallCanisterPromptPayload) => {
				status = s;

				setTimeout(() => {
					emit({
						message: 'oisyDemoReloadBalance'
					});
				}, 2000);
			}
		});
	});
</script>

{#if nonNullish(status)}
	<div class="dark:text-white" in:fade>
		<p class="font-bold mt-6">Call canister:</p>
		<p class="mb-2 break-words">
			{#if status === 'executing'}
				<output data-tid="loading-call-canister">Loading call canister...</output>
			{:else if status === 'result'}
				<output data-tid="result-call-canister">Canister call successful.</output>
			{:else if status === 'error'}
				<output data-tid="error-call-canister">Canister call error.</output>
			{/if}
		</p>
	</div>
{/if}
