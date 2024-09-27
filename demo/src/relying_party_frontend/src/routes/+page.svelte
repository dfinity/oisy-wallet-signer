<script lang="ts">
	import UserId from '$core/components/UserId.svelte';
	import Balance from '$core/components/Balance.svelte';
	import Article from '$core/components/Article.svelte';
	import { IcpWallet } from '@dfinity/oisy-wallet-signer/icp-wallet';
	import { isNullish, nonNullish } from '@dfinity/utils';
	import Connect from '$lib/components/Connect.svelte';
	import { fade } from 'svelte/transition';
	import { authStore } from '$core/stores/auth.store';
	import Wallet from '$lib/components/Wallet.svelte';

	let wallet = $state<IcpWallet | undefined>(undefined);

	$effect(() => {
		return () => {
			wallet?.disconnect();
		};
	});
</script>

<p class="dark:text-white mb-4">Transfer 0.05 ICP (minus fees) to and from your Oisy Wallet.</p>

<div class="md:grid grid-cols-2 gap-10 max-w-2xl">
	<section>
		<Article>
			<UserId shorten user={$authStore?.identity?.getPrincipal()} />

			<Balance />
		</Article>

		<div class="md:min-h-20">
			{#if isNullish(wallet)}
				<div in:fade>
					<Connect bind:wallet />
				</div>
			{/if}
		</div>
	</section>

	{#if nonNullish(wallet)}
		<section in:fade>
			<Wallet {wallet} />
		</section>
	{/if}
</div>
