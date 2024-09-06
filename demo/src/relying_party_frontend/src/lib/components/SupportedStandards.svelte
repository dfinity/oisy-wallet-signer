<script lang="ts">
	import type { IcpWallet } from '@dfinity/oisy-wallet-signer/icp-wallet';
	import { isNullish, nonNullish } from '@dfinity/utils';
	import type { IcrcSupportedStandards } from '@dfinity/oisy-wallet-signer';
	import Value from '$core/components/Value.svelte';
	import { fade } from 'svelte/transition';

	type Props = {
		wallet: IcpWallet | undefined;
	};

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
			{#each supportedStandards as standard}
				<li>{standard.name}</li>
			{/each}
		</ul>
	</Value>
{/if}
