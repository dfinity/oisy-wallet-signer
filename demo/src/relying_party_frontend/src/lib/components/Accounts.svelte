<script lang="ts">
	import type { Wallet } from '@dfinity/oisy-wallet-signer/wallet';
	import { nonNullish } from '@dfinity/utils';
	import { fade } from 'svelte/transition';
	import Button from '$core/components/Button.svelte';
	import Value from '$core/components/Value.svelte';
	import { accountsStore } from '$lib/stores/accounts.store';

	type Props = {
		wallet: Wallet | undefined;
	};

	let { wallet }: Props = $props();

	const onclick = async () => {
		const accounts = await wallet?.accounts();
		accountsStore.set(accounts);
	};

	const onreset = async () => {
		accountsStore.set(null);
	};
</script>

{#if nonNullish(wallet)}
	<div in:fade>
		<Value id="accounts" testId="accounts" title="Accounts">
			{#if nonNullish($accountsStore)}
				<ul in:fade data-tid="accounts-list">
					{#each $accountsStore as account}
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
