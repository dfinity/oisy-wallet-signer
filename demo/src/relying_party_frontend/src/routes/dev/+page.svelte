<script lang="ts">
	import type { IcrcWallet } from '@dfinity/oisy-wallet-signer/icrc-wallet';
	import { isNullish } from '@dfinity/utils';
	import { fade } from 'svelte/transition';
	import Balance from '$core/components/Balance.svelte';
	import UserId from '$core/components/UserId.svelte';
	import Value from '$core/components/Value.svelte';
	import { authStore } from '$core/stores/auth.store';
	import Accounts from '$lib/components/Accounts.svelte';
	import BuildConsentMessage from '$lib/components/BuildConsentMessage.svelte';
	import CallCanister from '$lib/components/CallCanister.svelte';
	import Connect from '$lib/components/Connect.svelte';
	import Permissions from '$lib/components/Permissions.svelte';
	import RequestPermissions from '$lib/components/RequestPermissions.svelte';
	import SupportedStandards from '$lib/components/SupportedStandards.svelte';

	let wallet = $state<IcrcWallet | undefined>(undefined);

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
		<Value id="wallet-connected" testId="wallet-connected" title="Wallet status">
			<span data-tid="wallet-connected-value">Connected</span>
		</Value>
	</div>
{:else}
	<div in:fade>
		<Value id="wallet-disconnected" testId="wallet-disconnected" title="Wallet status"
			><span data-tid="wallet-connected-value">Disconnected</span></Value
		>
	</div>
{/if}

<SupportedStandards {wallet} />

<Permissions {wallet} />

<RequestPermissions {wallet} />

<Accounts {wallet} />

<CallCanister {wallet} />

<BuildConsentMessage {wallet} />
