<script lang="ts">
	import Button from '$core/components/Button.svelte';
	import { IcrcWallet } from '@dfinity/oisy-wallet-signer/icrc-wallet';
	import { WALLET_URL } from '$core/constants/app.constants';
	import type { OnDisconnect } from '@dfinity/oisy-wallet-signer';

	type Props = {
		wallet: IcrcWallet | undefined;
		onDisconnect: OnDisconnect;
	};

	let { wallet = $bindable(), onDisconnect }: Props = $props();

	let walletState = $state<IcrcWallet | undefined>(undefined);

	const onclick = async () => {
		walletState = await IcrcWallet.connect({
			url: WALLET_URL,
			onDisconnect
		});
	};

	$effect(() => {
		wallet = walletState;
	});
</script>

<Button {onclick} testId="connect-wallet-button">Connect Wallet</Button>
