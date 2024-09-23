<script lang="ts">
	import type { Signer } from '@dfinity/oisy-wallet-signer/signer';
	import {
		type CallCanisterPromptPayload,
		ICRC49_CALL_CANISTER,
		type Status
	} from '@dfinity/oisy-wallet-signer';
	import { isNullish, nonNullish } from '@dfinity/utils';
	import { fade } from 'svelte/transition';
	import { emit } from '$core/utils/events.utils';

	type Props = {
		signer: Signer | undefined;
	};

	let { signer }: Props = $props();

	let status = $state<Status | undefined>(undefined);

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
	<div in:fade>
		<p class="font-bold text-sm mt-3">Call canister:</p>
		<p class="text-sm mb-2 break-words">
			{#if status === 'loading'}
				<output data-tid="loading-call-canister">Loading call canister...</output>
			{:else if status === 'result'}
				<output data-tid="result-call-canister">Canister call successful.</output>
			{:else if status === 'error'}
				<output data-tid="error-call-canister">Canister call error.</output>
			{/if}
		</p>
	</div>
{/if}
