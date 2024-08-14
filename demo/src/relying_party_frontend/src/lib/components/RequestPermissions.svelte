<script lang="ts">
	import type { Wallet } from '@dfinity/oisy-wallet-signer/wallet';
	import { nonNullish } from '@dfinity/utils';
	import { fade } from 'svelte/transition';
	import Button from '$core/components/Button.svelte';
	import Value from '$core/components/Value.svelte';
	import type { IcrcScope } from '@dfinity/oisy-wallet-signer';

	type Props = {
		wallet: Wallet | undefined;
	};

	let { wallet }: Props = $props();

	let scopes: IcrcScope[] | undefined = $state(undefined);

	const onclick = async () => {
		const result = await wallet?.requestPermissions();
		scopes = result?.scopes;
	};
</script>

{#if nonNullish(wallet)}
	<div in:fade>
		<Value id="request-permissions" testId="request-permissions" title="Permissions requests">
			{#if nonNullish(scopes)}
				{#each scopes as scope}
					<p>{scope.scope.method}: <strong>{scope.state}</strong></p>
				{/each}
			{:else}
				<Button {onclick} testId="request-permissions-button">Request permissions</Button>
			{/if}
		</Value>
	</div>
{/if}
