<script lang="ts">
	import type { Wallet } from '@dfinity/oisy-wallet-signer/wallet';
	import { isNullish, nonNullish } from '@dfinity/utils';
	import { fade } from 'svelte/transition';
	import Button from '$core/components/Button.svelte';
	import Value from '$core/components/Value.svelte';
	import type { IcrcScope, IcrcSupportedStandards } from '@dfinity/oisy-wallet-signer';

	type Props = {
		wallet: Wallet | undefined;
	};

	let { wallet }: Props = $props();

	let scopes: IcrcScope[] | undefined = $state(undefined);

	$effect(() => {
		(async () => {
			if (isNullish(wallet)) {
				return;
			}

			scopes = await wallet.permissions();
		})();
	});
</script>
