<script lang="ts">
	import { fade } from 'svelte/transition';
	import { IcpWallet } from '@dfinity/oisy-wallet-signer/icp-wallet';
	import { isNullish } from '@dfinity/utils';
	import UserId from '$core/components/UserId.svelte';
	import Balance from '$core/components/Balance.svelte';
	import Connect from "$lib/components/Connect.svelte";

	let wallet = $state<IcpWallet | undefined>(undefined);
</script>

<UserId />

<Balance />

{#if isNullish(wallet)}
	<div class="pt-6">
		<Connect bind:wallet />
	</div>
{:else}
	<div in:fade></div>
{/if}
