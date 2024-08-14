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
		scopes = await wallet?.requestPermissions();
	};
</script>

{#if nonNullish(wallet)}
	{#if nonNullish(scopes)}
		<div in:fade>
			<Value id="granted-permissions" testId="response-permissions" title="Permissions">
				{#each scopes as scope}
					<p>{scope.scope.method}: <strong>{scope.state}</strong></p>
				{/each}
			</Value>
		</div>
	{:else}
		<div in:fade>
			<Value id="request-permissions" testId="request-permissions" title="Permissions">
				<Button {onclick} testId="request-permissions-button">Request permissions</Button>
			</Value>
		</div>
	{/if}
{/if}
