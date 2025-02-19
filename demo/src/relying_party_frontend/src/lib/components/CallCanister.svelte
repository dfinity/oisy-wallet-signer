<script lang="ts">
	import type { IcrcWallet } from '@dfinity/oisy-wallet-signer/icrc-wallet';
	import { nonNullish } from '@dfinity/utils';
	import { fade } from 'svelte/transition';
	import Value from '$core/components/Value.svelte';
	import Icrc1Transfer from '$lib/components/Icrc1Transfer.svelte';
	import Icrc2Approve from '$lib/components/Icrc2Approve.svelte';
	import Icrc2TransferFrom from '$lib/components/Icrc2TransferFrom.svelte';
	import { accountsStore } from '$lib/stores/accounts.store';

	interface Props {
		wallet: IcrcWallet | undefined;
	}

	let { wallet }: Props = $props();
</script>

{#if nonNullish(wallet) && nonNullish($accountsStore)}
	<div in:fade class="mt-4">
		<Value id="call-canister" testId="call-canister" title="Call Canister">
			<div class="flex flex-col gap-2 w-fit">
				<Icrc1Transfer {wallet} />

				<Icrc2Approve {wallet} />

				<Icrc2TransferFrom {wallet} />
			</div>
		</Value>
	</div>
{/if}
