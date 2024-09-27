<script lang="ts">
	import type { IcpWallet } from '@dfinity/oisy-wallet-signer/icp-wallet';
	import { nonNullish } from '@dfinity/utils';
	import { fade } from 'svelte/transition';
	import Button from '$core/components/Button.svelte';
	import Value from '$core/components/Value.svelte';
	import type { IcrcScopesArray } from '@dfinity/oisy-wallet-signer';
	import PermissionsScopes from '$lib/components/PermissionsScopes.svelte';
	import { emit } from '$core/utils/events.utils';

	type Props = {
		wallet: IcpWallet | undefined;
	};

	let { wallet }: Props = $props();

	let scopes = $state<IcrcScopesArray | undefined>(undefined);

	const onclick = async () => {
		scopes = await wallet?.requestPermissions();

		emit({
			message: 'oisyDemoReloadPermissions'
		});
	};
</script>

{#if nonNullish(wallet)}
	<div in:fade class="mb-4">
		<Value id="request-permissions" testId="request-permissions" title="Permissions requests">
			{#if nonNullish(scopes)}
				<PermissionsScopes {scopes} />
			{:else}
				<Button {onclick} testId="request-permissions-button">Request permissions</Button>
			{/if}
		</Value>
	</div>
{/if}
