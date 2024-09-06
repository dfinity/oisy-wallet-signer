<script lang="ts">
	import { fade } from 'svelte/transition';
	import { IcpWallet } from '@dfinity/oisy-wallet-signer/icp-wallet';
	import { isNullish } from '@dfinity/utils';
	import Button from '$core/components/Button.svelte';
	import UserId from '$core/components/UserId.svelte';
	import Value from '$core/components/Value.svelte';
	import SupportedStandards from '$lib/components/SupportedStandards.svelte';
	import RequestPermissions from '$lib/components/RequestPermissions.svelte';
	import Permissions from '$lib/components/Permissions.svelte';
	import Accounts from '$lib/components/Accounts.svelte';
	import CallCanister from '$lib/components/CallCanister.svelte';

	let wallet = $state<IcpWallet | undefined>(undefined);

	const onclick = async () => {
		wallet = await IcpWallet.connect({
			url: 'http://localhost:5174'
		});
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
		<Value id="wallet-connected" testId="wallet-connected" title="Wallet status">Connected</Value>
	</div>
{/if}

<SupportedStandards {wallet} />

<Permissions {wallet} />

<RequestPermissions {wallet} />

<Accounts {wallet} />

<CallCanister {wallet} />
