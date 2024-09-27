<script lang="ts">
	import { IcpWallet } from '@dfinity/oisy-wallet-signer/icp-wallet';
	import Button from '$core/components/Button.svelte';
	import { authStore } from '$core/stores/auth.store';
	import { isNullish } from '@dfinity/utils';
	import type { Icrc1TransferRequest } from '@dfinity/ledger-icp';
	import { alertStore } from '$core/stores/alert.store';
	import { emit } from '$core/utils/events.utils';
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
				url: 'http://localhost:5174/sign'
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

			emit({
				message: 'oisyDemoReloadBalance'
			});

			alertStore.set({
				type: 'success',
				message: 'Funds received 🥳',
				duration: 3000
			});
		} catch (err: unknown) {
			alertStore.set({
				type: 'error',
				message: 'Unexpected error.'
			});

			console.error(err);
		} finally {
			await wallet?.disconnect();
		}
	};
</script>

<Button {onclick} testId="connect-wallet-button">Get ICP</Button>
