<script lang="ts">
	import Button from '$core/components/Button.svelte';
	import { IcpWallet } from '@dfinity/oisy-wallet-signer/icp-wallet';
	import { WALLET_URL } from '$core/constants/app.constants';
	import { alertStore } from '$core/stores/alert.store';

	type Props = {
		wallet: IcpWallet | undefined;
		requestAccounts?: boolean;
	};

	let { wallet = $bindable(), requestAccounts = false }: Props = $props();

	let walletState = $state<IcpWallet | undefined>(undefined);

	const onclick = async () => {
		const w = await IcpWallet.connect({
			url: WALLET_URL
		});

		if (requestAccounts) {
			try {
				await w.accounts();
			} catch (err: unknown) {
				alertStore.set({
					type: 'error',
					message: 'The wallet did not provide any account.'
				});

				await w.disconnect();
				console.error(err);
				return;
			}
		}

		walletState = w;
	};

	$effect(() => {
		wallet = walletState;
	});
</script>

<Button {onclick} testId="connect-wallet-button">Connect Wallet</Button>
