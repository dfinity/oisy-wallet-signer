<script lang="ts">
	import { fade } from 'svelte/transition';
	import { Wallet } from '@dfinity/oisy-wallet-signer/wallet';
	import { isNullish } from '@dfinity/utils';
	import Button from '$core/components/Button.svelte';

	let wallet: Wallet | undefined = $state(undefined);

	const onclick = async () => {
		wallet = await Wallet.connect({
			url: 'http://localhost:5174'
		});
	};
</script>

{#if isNullish(wallet)}
	<Button {onclick} testId="connect-wallet">Connect Wallet</Button>
{:else}
	<div in:fade>
		<p>Connected</p>
	</div>
{/if}
