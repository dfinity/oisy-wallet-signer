<script lang="ts">
	import type { IcrcSupportedStandards } from '@dfinity/oisy-wallet-signer';
	import type { IcrcWallet } from '@dfinity/oisy-wallet-signer/icrc-wallet';
	import { isNullish, nonNullish } from '@dfinity/utils';
	import { fade } from 'svelte/transition';
	import Value from '$core/components/Value.svelte';

	interface Props {
		wallet: IcrcWallet | undefined;
	}

	let { wallet }: Props = $props();

	let supportedStandards = $state<IcrcSupportedStandards | undefined>(undefined);

	$effect(() => {
		(async () => {
			if (isNullish(wallet)) {
				return;
			}

			supportedStandards = await wallet.supportedStandards();
		})();
	});
</script>

{#if nonNullish(supportedStandards)}
	<Value id="supported-standards" testId="supported-standards" title="Supported standards">
		<ul in:fade>
			{#each supportedStandards as standard (standard.name)}
				<li>{standard.name}</li>
			{/each}
		</ul>
	</Value>
{/if}
