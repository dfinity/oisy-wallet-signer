<script lang="ts">
	import { fade } from 'svelte/transition';
	import { Wallet } from '@dfinity/oisy-wallet-signer/wallet';
	import { isNullish } from '@dfinity/utils';
	import Button from '$core/components/Button.svelte';
	import UserId from '$core/components/UserId.svelte';

	let wallet: Wallet | undefined = $state(undefined);

	const onclick = async () => {
		wallet = await Wallet.connect({
			url: 'http://localhost:5174'
		});

		await wallet.disconnect();
	};
</script>

<UserId />

{#if isNullish(wallet)}
	<Button {onclick} testId="connect-wallet-button">Connect Wallet</Button>
{:else}
	<div in:fade>
		<p data-tid="wallet-connected">Connected</p>
	</div>
{/if}
