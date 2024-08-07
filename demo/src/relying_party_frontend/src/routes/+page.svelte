<script lang="ts">
	import { fade } from 'svelte/transition';
	import { Wallet } from '@dfinity/oisy-wallet-signer/wallet';
	import { isNullish, nonNullish } from '@dfinity/utils';
	import Button from '$core/components/Button.svelte';
	import UserId from '$core/components/UserId.svelte';
	import type { IcrcSupportedStandards } from '@dfinity/oisy-wallet-signer';
	import Value from '$core/components/Value.svelte';

	let wallet: Wallet | undefined = $state(undefined);

	let supportedStandards: IcrcSupportedStandards | undefined = $state(undefined);

	const onclick = async () => {
		wallet = await Wallet.connect({
			url: 'http://localhost:5174'
		});

		supportedStandards = await wallet.supportedStandards();
	};

	$effect(() => {
		return () => {
			wallet?.disconnect();
		};
	});
</script>

<UserId />

{#if isNullish(wallet)}
	<div class="pt-6">
		<Button {onclick} testId="connect-wallet-button">Connect Wallet</Button>
	</div>
{:else}
	<div in:fade>
		<Value id="wallet-connected" testId="wallet-connected" title="Wallet status">Connected 🤝</Value
		>
	</div>
{/if}

{#if nonNullish(supportedStandards)}
	<Value id="user-id" title="Supported standards">
		<ul in:fade>
			{#each supportedStandards as standard}
				<li>{standard.name}</li>
			{/each}
		</ul>
	</Value>
{/if}
