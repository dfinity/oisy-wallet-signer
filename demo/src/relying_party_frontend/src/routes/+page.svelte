<script lang="ts">
	import type { IcrcAccount } from '@dfinity/oisy-wallet-signer';
	import { nonNullish } from '@dfinity/utils';
	import { fade } from 'svelte/transition';
	import Article from '$core/components/Article.svelte';
	import Balance from '$core/components/Balance.svelte';
	import UserId from '$core/components/UserId.svelte';
	import { authStore } from '$core/stores/auth.store';
	import ConnectAndRequestAccount from '$lib/components/ConnectAndRequestAccount.svelte';
	import SendICP from '$lib/components/SendICP.svelte';
	import Wallet from '$lib/components/Wallet.svelte';
	import WalletUrl from '$lib/components/WalletUrl.svelte';
	import { walletUrlStore } from '$lib/stores/wallet.store';

	let account = $state<IcrcAccount | undefined | null>(undefined);

	const resetAccount = () => (account = null);

	$effect(() => {
		$walletUrlStore;
		resetAccount();
	});
</script>

<p class="dark:text-white mb-4">Transfer 0.05 ICP (minus fees) to and from your Oisy Wallet.</p>

<div class="md:grid grid-cols-2 gap-10 max-w-2xl">
	<section>
		<Article>
			<UserId shorten user={$authStore?.identity?.getPrincipal()} />

			<Balance owner={$authStore.identity?.getPrincipal()} />
		</Article>

		<div class="md:min-h-20">
			{#if nonNullish(account)}
				<div in:fade>
					<SendICP />
				</div>
			{/if}
		</div>
	</section>

	<section>
		{#if nonNullish(account)}
			<div in:fade>
				<Wallet {account} />
			</div>
		{:else}
			<div in:fade>
				<ConnectAndRequestAccount bind:account />
			</div>
		{/if}
	</section>
</div>

<WalletUrl />
