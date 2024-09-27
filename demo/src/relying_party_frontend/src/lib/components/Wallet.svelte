<script lang="ts">
	import type { IcpWallet } from '@dfinity/oisy-wallet-signer/icp-wallet';
	import { Principal } from '@dfinity/principal';
	import { isNullish, nonNullish } from '@dfinity/utils';
	import Article from '$core/components/Article.svelte';
	import UserId from '$core/components/UserId.svelte';
	import GetICP from '$lib/components/GetICP.svelte';
	import SendICP from '$lib/components/SendICP.svelte';
    import { fade } from 'svelte/transition';

	type Props = {
		wallet: IcpWallet | undefined;
	};

	let { wallet }: Props = $props();

	let owner: Principal | undefined = $state(undefined);

	const loadOwner = async (wallet: IcpWallet | undefined) => {
		const accounts = await wallet?.accounts();

		const account = accounts?.[0];

		if (isNullish(account)) {
			return;
		}

		owner = Principal.fromText(account.owner);
	};

	$effect(() => {
		(async () => {
			await loadOwner(wallet);
		})();
	});
</script>

<Article>
	{#if nonNullish(owner)}
		<div in:fade>
            <UserId shorten user={owner} title="Your Wallet ID" />
        </div>
	{:else}
		<p class="dark:text-white animate-pulse">Connecting...</p>
	{/if}
</Article>

<div class="flex mt-4 gap-4">
	{#if nonNullish(owner)}
		<GetICP />

		<SendICP />
	{/if}
</div>
