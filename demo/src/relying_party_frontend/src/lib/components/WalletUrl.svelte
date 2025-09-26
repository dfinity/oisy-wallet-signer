<script lang="ts">
	import type { UrlSchema } from '@dfinity/zod-schemas';
	import type * as z from 'zod/v4';
	import InputSelect from '$core/components/InputSelect.svelte';
	import Value from '$core/components/Value.svelte';
    import {
        WALLET_TEST_DOMAINS,
        PROD,
        WALLET_DEFAULT_URL
    } from '$core/constants/app.constants';
	import { walletUrlStore } from '$lib/stores/wallet.store';

	interface SelectUrl {
		name: string;
		value: string;
	}

	type SignerUrl = z.infer<typeof UrlSchema>;

	const mapUrl = (url: SignerUrl): SelectUrl => ({
		name: URL.parse(url)?.host ?? url,
		value: url
	});

	let walletUrl = $state(WALLET_DEFAULT_URL);

	const URLS = [
		WALLET_DEFAULT_URL,
		...(PROD ? WALLET_TEST_DOMAINS.map(domain => `https://${domain}/sign`) : [])
	].map<SelectUrl>(mapUrl);

	const onchange = () => {
		walletUrlStore.set(walletUrl);
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
