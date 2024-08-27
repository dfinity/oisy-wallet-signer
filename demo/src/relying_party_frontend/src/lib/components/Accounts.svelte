<script lang="ts">
	import type { Wallet } from '@dfinity/oisy-wallet-signer/wallet';
	import { nonNullish } from '@dfinity/utils';
	import { fade } from 'svelte/transition';
	import Button from '$core/components/Button.svelte';
	import Value from '$core/components/Value.svelte';
	import type { IcrcAccounts } from '@dfinity/oisy-wallet-signer';

	type Props = {
		wallet: Wallet | undefined;
	};

	let { wallet }: Props = $props();

	let accounts: IcrcAccounts | undefined = $state(undefined);

	const onclick = async () => {
		accounts = await wallet?.accounts();
	};

	const onreset = async () => {
		accounts = undefined;
	};
</script>

{#if nonNullish(wallet)}
	<div in:fade>
		<Value id="accounts" testId="accounts" title="Accounts">
			{#if nonNullish(accounts)}
				<ul in:fade data-tid="accounts-list">
					{#each accounts as account}
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
