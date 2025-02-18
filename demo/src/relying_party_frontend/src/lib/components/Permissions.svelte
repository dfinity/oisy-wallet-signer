<script lang="ts">
	import type { IcrcWallet } from '@dfinity/oisy-wallet-signer/icrc-wallet';
	import { isNullish, nonNullish } from '@dfinity/utils';
	import type { IcrcScopesArray } from '@dfinity/oisy-wallet-signer';
	import { fade } from 'svelte/transition';
	import Value from '$core/components/Value.svelte';
	import PermissionsScopes from '$lib/components/PermissionsScopes.svelte';

	type Props = {
		wallet: IcrcWallet | undefined;
	};

	let { wallet }: Props = $props();

	let scopes = $state<IcrcScopesArray | undefined>(undefined);

	const loadPermissions = async () => {
		if (isNullish(wallet)) {
			scopes = undefined;
			return;
		}

		scopes = await wallet.permissions();
	};

	$effect(() => {
		(async () => await loadPermissions())();
	});

	const onoisyDemoReloadPermissions = async () => {
		await loadPermissions();
	};
</script>

<svelte:window {onoisyDemoReloadPermissions} />

{#if nonNullish(wallet)}
	<div in:fade>
		<Value id="permissions" testId="permissions" title="Permissions state">
			{#if nonNullish(scopes)}
				<PermissionsScopes {scopes} />
			{:else}
				<p>None defined.</p>
			{/if}
		</Value>
	</div>
{/if}
