<script lang="ts">
	import { IcpWallet } from '@dfinity/oisy-wallet-signer/icp-wallet';
	import Button from '$core/components/Button.svelte';
	import { authStore } from '$core/stores/auth.store';
	import { createAgent, isNullish } from '@dfinity/utils';
	import { LedgerCanister } from '@dfinity/ledger-icp';
	import { alertStore } from '$core/stores/alert.store';
	import { emit } from '$core/utils/events.utils';
	import { getTransferRequest } from '$lib/utils/transfer.utils';
	import { Principal } from '@dfinity/principal';
	import { DEV, LOCAL_REPLICA_URL, WALLET_URL } from '$lib/constants/app.constants';

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
				url: WALLET_URL
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
				...(DEV && { host: LOCAL_REPLICA_URL }),
				identity: $authStore.identity,
				fetchRootKey: true
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

			emit({
				message: 'oisyDemoReloadBalance'
			});

			alertStore.set({
				type: 'success',
				message: 'Funds sent 🥳',
				duration: 3000
			});
		} catch (err: unknown) {
			alertStore.set({
				type: 'error',
				message: 'Unexpected error.'
			});

			console.error(err);
		}
	};
</script>

<Button {onclick} testId="connect-wallet-button">Send ICP</Button>
