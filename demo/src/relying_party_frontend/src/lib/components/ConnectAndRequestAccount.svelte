<script lang="ts">
	import Button from '$core/components/Button.svelte';
	import { IcpWallet } from '@dfinity/oisy-wallet-signer/icp-wallet';
	import { WALLET_URL } from '$core/constants/app.constants';
	import { alertStore } from '$core/stores/alert.store';
	import type { IcrcAccount } from '@dfinity/oisy-wallet-signer';

	type Props = {
		account: IcrcAccount | undefined;
	};

	let { account = $bindable() }: Props = $props();

	const onclick = async () => {
		let wallet: IcpWallet | undefined;

		try {
			wallet = await IcpWallet.connect({
				url: WALLET_URL
			});

			await wallet.requestPermissions();

			const accounts = await wallet.accounts();

			account = accounts?.[0];
		} catch (err: unknown) {
			alertStore.set({
				type: 'error',
				message: 'The wallet did not provide any account.'
			});

			console.error(err);
			return;
		} finally {
			await wallet?.disconnect();
		}
	};
</script>

<Button {onclick} testId="connect-wallet-button">Connect Wallet</Button>
