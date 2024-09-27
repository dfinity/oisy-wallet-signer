<script lang="ts">
	import { fade } from 'svelte/transition';
	import { IcpWallet } from '@dfinity/oisy-wallet-signer/icp-wallet';
	import { isNullish } from '@dfinity/utils';
	import UserId from '$core/components/UserId.svelte';
	import Value from '$core/components/Value.svelte';
	import SupportedStandards from '$lib/components/SupportedStandards.svelte';
	import RequestPermissions from '$lib/components/RequestPermissions.svelte';
	import Permissions from '$lib/components/Permissions.svelte';
	import Accounts from '$lib/components/Accounts.svelte';
	import CallCanister from '$lib/components/CallCanister.svelte';
	import Balance from '$core/components/Balance.svelte';
	import Connect from "$lib/components/Connect.svelte";

	let wallet = $state<IcpWallet | undefined>(undefined);
</script>

<UserId />

<Balance />

{#if isNullish(wallet)}
	<div class="pt-6">
		<Connect bind:wallet />
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
