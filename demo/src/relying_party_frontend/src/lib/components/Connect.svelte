<script lang="ts">
	import Button from '$core/components/Button.svelte';
	import { IcpWallet } from '@dfinity/oisy-wallet-signer/icp-wallet';
	import { WALLET_URL } from '$core/constants/app.constants';
	import type { OnDisconnect } from '@dfinity/oisy-wallet-signer';

	type Props = {
		wallet: IcpWallet | undefined;
		onDisconnect: OnDisconnect;
	};

	let { wallet = $bindable(), onDisconnect }: Props = $props();

	let walletState = $state<IcpWallet | undefined>(undefined);

	const onclick = async () => {
		walletState = await IcpWallet.connect({
			url: WALLET_URL,
			onDisconnect
		});
	};

	$effect(() => {
		wallet = walletState;
	});
</script>

<Button {onclick} testId="connect-wallet-button">Connect Wallet</Button>
