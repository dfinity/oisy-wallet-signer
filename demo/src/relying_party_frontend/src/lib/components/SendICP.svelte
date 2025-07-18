<script lang="ts">
	import { LedgerCanister } from '@dfinity/ledger-icp';
	import { IcpWallet } from '@dfinity/oisy-wallet-signer/icp-wallet';
	import { Principal } from '@dfinity/principal';
	import { createAgent, isNullish } from '@dfinity/utils';
	import Button from '$core/components/Button.svelte';
	import { DEV, LOCAL_REPLICA_URL } from '$core/constants/app.constants';
	import { alertStore } from '$core/stores/alert.store';
	import { authStore } from '$core/stores/auth.store';
	import { emit } from '$core/utils/events.utils';
	import { walletUrlStore } from '$lib/stores/wallet.store';
	import { getTransferRequest } from '$lib/utils/transfer.utils';

	let wallet = $state<IcpWallet | undefined>(undefined);

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
				await wallet?.disconnect();

				alertStore.set({
					type: 'error',
					message: 'The wallet did not provide any account.'
				});
				return;
			}

			await wallet?.disconnect();

			const agent = await createAgent({
				...(DEV && { host: LOCAL_REPLICA_URL, fetchRootKey: true }),
				identity: $authStore.identity
			});

			const { icrc1Transfer } = LedgerCanister.create({
				agent
			});

			const { owner } = account;

			const request = getTransferRequest({
				owner: Principal.fromText(owner),
				minusFees: true
			});

			await icrc1Transfer(request);

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
				message: 'ICP sent 🥳',
				duration: 3000
			});
		} catch (err: unknown) {
			alertStore.set({
				type: 'error',
				message: 'Unexpected error while sending ICP.'
			});

			console.error(err);
		}
	};
</script>

<Button {onclick} testId="connect-wallet-button">Send ICP to Wallet</Button>
