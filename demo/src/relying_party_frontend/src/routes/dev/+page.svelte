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
	import Connect from '$lib/components/Connect.svelte';
	import { authStore } from '$core/stores/auth.store';
	import BuildConsentMessage from '$lib/components/BuildConsentMessage.svelte';

	let wallet = $state<IcpWallet | undefined>(undefined);

	$effect(() => {
		disconnected = false;

		return () => {
			wallet?.disconnect();
		};
	});

	let disconnected = $state<boolean>(false);

	const onDisconnect = () => {
		disconnected = true;
	};
</script>

<UserId user={$authStore?.identity?.getPrincipal()} />

<Balance owner={$authStore.identity?.getPrincipal()} />

{#if isNullish(wallet)}
	<div class="pt-6" in:fade>
		<Connect bind:wallet {onDisconnect} />
	</div>
{:else if !disconnected}
	<div in:fade>
		<Value id="wallet-connected" testId="wallet-connected" title="Wallet status">Connected</Value>
	</div>
{:else}
	<div in:fade>
		<Value id="wallet-disconnected" testId="wallet-disconnected" title="Wallet status"
			>Disconnected</Value
		>
	</div>
{/if}

<SupportedStandards {wallet} />

<Permissions {wallet} />

<RequestPermissions {wallet} />

<Accounts {wallet} />

<CallCanister {wallet} />

<BuildConsentMessage {wallet} />
