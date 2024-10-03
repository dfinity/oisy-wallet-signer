<script lang="ts">
	import UserId from '$core/components/UserId.svelte';
	import Balance from '$core/components/Balance.svelte';
	import Article from '$core/components/Article.svelte';
	import { fade } from 'svelte/transition';
	import { authStore } from '$core/stores/auth.store';
	import Wallet from '$lib/components/Wallet.svelte';
	import SendICP from '$lib/components/SendICP.svelte';
	import ConnectAndRequestAccount from '$lib/components/ConnectAndRequestAccount.svelte';
	import type { IcrcAccount } from '@dfinity/oisy-wallet-signer';
	import { isNullish, nonNullish } from '@dfinity/utils';

	let account = $state<IcrcAccount | undefined>(undefined);
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
