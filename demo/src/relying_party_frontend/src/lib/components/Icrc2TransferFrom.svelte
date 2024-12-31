<script lang="ts">
	import type { IcrcWallet } from '@dfinity/oisy-wallet-signer/icrc-wallet';
	import { isNullish, nonNullish } from '@dfinity/utils';
	import Button from '$core/components/Button.svelte';
	import { accountsStore } from '$lib/stores/accounts.store';
	import { authStore } from '$core/stores/auth.store';
	import type { IcrcBlockIndex, TransferFromParams } from '@dfinity/ledger-icrc';
	import { E8S_PER_ICP, ICP_LEDGER_CANISTER_ID } from '$core/constants/app.constants';
	import { Principal } from '@dfinity/principal';
	import { emit } from '$core/utils/events.utils';

	type Props = {
		wallet: IcrcWallet | undefined;
	};

	let { wallet }: Props = $props();

	let result = $state<IcrcBlockIndex | undefined>(undefined);

	const onclick = async () => {
		// TODO: handle errors
		if (isNullish($authStore.identity)) {
			return;
		}

		const account = $accountsStore?.[0];

		if (isNullish(account)) {
			return;
		}

		const params: TransferFromParams = {
			from: {
				owner: Principal.fromText(account.owner),
				subaccount: []
			},
			to: {
				owner: $authStore.identity.getPrincipal(),
				subaccount: []
			},
			amount: 1n * (E8S_PER_ICP / 4n)
		};

		result = await wallet?.transferFrom({
			ledgerCanisterId: ICP_LEDGER_CANISTER_ID,
			owner: account.owner,
			params
		});

		setTimeout(() => {
			emit({
				message: 'oisyDemoReloadBalance'
			});
		}, 2000);
	};

	const onreset = async () => {
		result = undefined;
	};
</script>

{#if nonNullish(result)}
	<Button onclick={onreset} testId="reset-icrc2-approve-button">Reset icrc2_transfer_from</Button>
{:else}
	<Button {onclick} testId="call-icrc2-approve-button">icrc2_transfer_from</Button>
{/if}
