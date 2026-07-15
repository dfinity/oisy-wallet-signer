<script lang="ts">
	import type { IcrcAccount } from '@dfinity/oisy-wallet-signer';
	import { createAgent, isNullish } from '@dfinity/utils';
	import { IcpLedgerCanister } from '@icp-sdk/canisters/ledger/icp';
	import { Principal } from '@icp-sdk/core/principal';
	import Button from '$core/components/Button.svelte';
	import { DEV, LOCAL_REPLICA_URL } from '$core/constants/app.constants';
	import { alertStore } from '$core/stores/alert.store';
	import { authStore } from '$core/stores/auth.store';
	import { emit } from '$core/utils/events.utils';
	import { getTransferRequest } from '$lib/utils/transfer.utils';

	interface Props {
		account: IcrcAccount;
	}

	let { account }: Props = $props();

	const onclick = async () => {
		try {
			if (isNullish($authStore.identity)) {
				alertStore.set({
					type: 'error',
					message: 'You are not signed-in?'
				});
				return;
			}

			const agent = await createAgent({
				...(DEV && { host: LOCAL_REPLICA_URL, fetchRootKey: true }),
				identity: $authStore.identity
			});

			const { icrc1Transfer } = IcpLedgerCanister.create({
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
