<script lang="ts">
	import type { IcrcWallet } from '@dfinity/oisy-wallet-signer/icrc-wallet';
	import { nonNullish } from '@dfinity/utils';
	import { fade } from 'svelte/transition';
	import Button from '$core/components/Button.svelte';
	import Value from '$core/components/Value.svelte';
	import { accountsStore } from '$lib/stores/accounts.store';

	interface Props {
		wallet: IcrcWallet | undefined;
	}

	let { wallet }: Props = $props();

	const onclick = async () => {
		const accounts = await wallet?.accounts();
		accountsStore.set(accounts);
	};

	const onreset = () => {
		accountsStore.set(null);
	};
</script>

{#if nonNullish(wallet)}
	<div in:fade class="mt-2">
		<Value id="accounts" testId="accounts" title="Accounts">
			{#if nonNullish($accountsStore)}
				<ul in:fade data-tid="accounts-list">
					{#each $accountsStore as account (account.owner)}
						<li>{account.owner}</li>
					{/each}
				</ul>

				<Button onclick={onreset} testId="reset-accounts-button">Reset accounts</Button>
			{:else}
				<Button {onclick} testId="accounts-button">Accounts</Button>
			{/if}
		</Value>
	</div>
{/if}
