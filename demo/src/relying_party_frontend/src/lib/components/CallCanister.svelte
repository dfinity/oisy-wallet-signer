<script lang="ts">
	import type { IcpWallet } from '@dfinity/oisy-wallet-signer/icp-wallet';
	import { nonNullish } from '@dfinity/utils';
	import { fade } from 'svelte/transition';
	import Value from '$core/components/Value.svelte';
	import { accountsStore } from '$lib/stores/accounts.store';
	import Icrc1Transfer from '$lib/components/Icrc1Transfer.svelte';
	import Icrc2Approve from '$lib/components/Icrc2Approve.svelte';

	type Props = {
		wallet: IcpWallet | undefined;
	};

	let { wallet }: Props = $props();
</script>

{#if nonNullish(wallet) && nonNullish($accountsStore)}
	<div in:fade class="mt-4">
		<Value id="call-canister" testId="call-canister" title="Call Canister">
			<div class="flex flex-col gap-2 w-fit">
				<Icrc1Transfer {wallet} />

				<Icrc2Approve {wallet} />
			</div>
		</Value>
	</div>
{/if}
