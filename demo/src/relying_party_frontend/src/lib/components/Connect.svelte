<script lang="ts">
	import type { OnDisconnect } from '@dfinity/oisy-wallet-signer';
	import { IcrcWallet } from '@dfinity/oisy-wallet-signer/icrc-wallet';
	import Button from '$core/components/Button.svelte';
	import { WALLET_URL } from '$core/constants/app.constants';

	interface Props {
		wallet: IcrcWallet | undefined;
		onDisconnect: OnDisconnect;
	}

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
