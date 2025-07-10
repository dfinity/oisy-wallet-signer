<script lang="ts">
	import InputSelect from '$core/components/InputSelect.svelte';
	import Value from '$core/components/Value.svelte';
	import {
		OISY_BETA_URL,
		OISY_STAGING_URL,
		PROD,
		WALLET_DEFAULT_URL
	} from '$core/constants/app.constants';
	import { emit } from '$core/utils/events.utils';
	import { walletUrlStore } from '$lib/stores/wallet.store';

	let walletUrl = $state($walletUrlStore);

	$effect(() => {
		walletUrlStore.set(walletUrl);
	});

	interface SelectUrl {
		name: string;
		value: string;
	}

	let urls = $derived(
		[WALLET_DEFAULT_URL, ...(PROD ? [OISY_STAGING_URL, OISY_BETA_URL] : [])].map<SelectUrl>(
			(url) => ({
				name: URL.parse(url)?.host ?? url,
				value: url
			})
		)
	);

	const disconnect = () =>
		emit({
			message: 'oisyDemoDisconnectWallet'
		});
</script>

<div class="mt-12 md:mt-0">
	<Value id="oisy-wallet-url" title="OISY URL">
		<InputSelect value={walletUrl} name="The OISY Wallet URL to connect to" onchange={disconnect}>
			{#each urls as { name, value } (value)}
				<option {value}>{name}</option>
			{/each}
		</InputSelect>
	</Value>
</div>
