<script lang="ts">
	import { IcpWallet } from '@dfinity/oisy-wallet-signer/icp-wallet';
	import { isNullish, notEmptyString } from '@dfinity/utils';
	import Button from '$core/components/Button.svelte';
	import { alertStore } from '$core/stores/alert.store';
	import { authStore } from '$core/stores/auth.store';
	import { emit } from '$core/utils/events.utils';
	import { walletUrlStore } from '$lib/stores/wallet.store';
	import { getTransferRequest } from '$lib/utils/transfer.utils';

	let wallet = $state<IcpWallet | undefined>(undefined);

	// TODO: display error on timeout
	// TODO: connect button first that ask for accounts
	// TODO: then display wallet account owner and its balance

	const onclick = async () => {
		try {
			if (isNullish($authStore.identity)) {
				alertStore.set({
					type: 'error',
					message: 'You are not signed-in?'
				});
				return;
			}

			wallet = await IcpWallet.connect({
				url: $walletUrlStore
			});

			const accounts = await wallet?.accounts();

			const account = accounts?.[0];

			if (isNullish(account)) {
				alertStore.set({
					type: 'error',
					message: 'The wallet did not provide any account.'
				});
				return;
			}

			const request = getTransferRequest({
				owner: $authStore.identity.getPrincipal(),
				minusFees: false
			});

			await wallet?.icrc1Transfer({
				owner: account.owner,
				request
			});

			const reload = () =>
				emit({
					message: 'oisyDemoReloadBalance'
				});

			reload();

			// Just in case it takes few seconds on mainnet
			setTimeout(() => {
				reload();
			}, 3000);

			alertStore.set({
				type: 'success',
				message: 'ICP received 🥳',
				duration: 3000
			});
		} catch (err: unknown) {
			const { message } = err as Error;

			alertStore.set({
				type: 'error',
				message: notEmptyString(message)
					? message
					: 'Unexpected error. Check the console output; this is just a demo 😉! Joking aside, you may just not have enough funds for the transfer.'
			});
		} finally {
			await wallet?.disconnect();
		}
	};
</script>

<Button {onclick} testId="connect-wallet-button">Get ICP from Wallet</Button>
