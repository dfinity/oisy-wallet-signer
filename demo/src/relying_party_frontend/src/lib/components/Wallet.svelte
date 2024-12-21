<script lang="ts">
	import type { IcrcAccount } from '@dfinity/oisy-wallet-signer';
	import { Principal } from '@dfinity/principal';
	import { nonNullish } from '@dfinity/utils';
	import { fade } from 'svelte/transition';
	import Article from '$core/components/Article.svelte';
	import Balance from '$core/components/Balance.svelte';
	import UserId from '$core/components/UserId.svelte';
	import GetICP from '$lib/components/GetICP.svelte';

	interface Props {
		account: IcrcAccount;
	}

	let { account }: Props = $props();

	let owner: Principal | undefined = $derived(Principal.fromText(account.owner));
</script>

<Article>
	{#if nonNullish(owner)}
		<div in:fade>
			<UserId shorten user={owner} title="Your Oisy Wallet ID" />

			<Balance {owner} />
		</div>
	{:else}
		<p class="dark:text-white animate-pulse">Connecting...</p>
	{/if}
</Article>

{#if nonNullish(owner)}
	<div class="in:fade">
		<GetICP />
	</div>
{/if}
