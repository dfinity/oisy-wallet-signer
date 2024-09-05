<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { Signer } from '@dfinity/oisy-wallet-signer/signer';
	import { isNullish, nonNullish } from '@dfinity/utils';
	import { ICRC27_ACCOUNTS } from '@dfinity/oisy-wallet-signer';
	import type {
		AccountsConfirmation,
		AccountsPromptPayload
	} from '@dfinity/oisy-wallet-signer/types/signer-prompts';
	import { authStore } from '$core/stores/auth.store';

	type Props = {
		signer: Signer | undefined;
	};

	let { signer }: Props = $props();

	let confirm = $state<AccountsConfirmation | undefined>(undefined);

	const resetPrompt = () => {
		confirm = undefined;
	};

	$effect(() => {
		if (isNullish(signer)) {
			resetPrompt();
			return;
		}

		signer.register({
			method: ICRC27_ACCOUNTS,
			prompt: ({ confirmAccounts }: AccountsPromptPayload) => {
				confirm = confirmAccounts;
			}
		});
	});

	$effect(() => {
		if (isNullish(confirm)) {
			return;
		}

		if (isNullish($authStore.identity)) {
			// TODO: error
			return;
		}

		confirm([
			{
				owner: $authStore.identity.getPrincipal().toText()
			}
		]);

		// Just to animate the UI. Strictly related to this demo.
		setTimeout(() => resetPrompt(), 1000);
	});
</script>

{#if nonNullish(confirm)}
	<p transition:fade data-tid="accounts" class="mt-2"><small>Notifying accounts...</small></p>
{/if}
