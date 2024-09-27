<script lang="ts">
	import Button from '$core/components/Button.svelte';
	import { IcpWallet } from '@dfinity/oisy-wallet-signer/icp-wallet';

	let { wallet = $bindable() } = $props();

	let walletState = $state<IcpWallet | undefined>(undefined);

	const onclick = async () => {
		walletState = await IcpWallet.connect({
			url: 'http://localhost:5174/sign'
		});
	};

	$effect(() => {
		return () => {
			walletState?.disconnect();
		};
	});

	$effect(() => {
		wallet = walletState;
	});
</script>

<Button {onclick} testId="connect-wallet-button">Connect Wallet</Button>
