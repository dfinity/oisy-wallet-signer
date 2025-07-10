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

	interface SelectUrl {
		name: string;
		value: string;
	}

	const mapUrl = (url: string): SelectUrl => ({
		name: URL.parse(url)?.host ?? url,
		value: url
	});

	let walletUrl = $state(WALLET_DEFAULT_URL);

	const URLS = [
		WALLET_DEFAULT_URL,
		...(PROD ? [OISY_STAGING_URL, OISY_BETA_URL] : [OISY_STAGING_URL, OISY_BETA_URL])
	].map<SelectUrl>(mapUrl);

	const onchange = () => {
		walletUrlStore.set(walletUrl);

		emit({
			message: 'oisyDemoDisconnectWallet'
		});
	};
</script>

<div class="mt-12 md:mt-0">
	<Value id="oisy-wallet-url" title="OISY URL">
		<InputSelect bind:value={walletUrl} name="The OISY Wallet URL to connect to" {onchange}>
			{#each URLS as { name, value }, index (index)}
				<option {value}>{name}</option>
			{/each}
		</InputSelect>
	</Value>
</div>
