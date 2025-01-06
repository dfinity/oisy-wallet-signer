<script lang="ts">
	import type { IcrcWallet } from '@dfinity/oisy-wallet-signer/icrc-wallet';
	import { isNullish, nonNullish } from '@dfinity/utils';
	import { fade } from 'svelte/transition';
	import Button from '$core/components/Button.svelte';
	import Value from '$core/components/Value.svelte';
	import { accountsStore } from '$lib/stores/accounts.store';
	import { authStore } from '$core/stores/auth.store';
	import type { TransferParams, ApproveParams } from '@dfinity/ledger-icrc';
	import { E8S_PER_ICP } from '$core/constants/app.constants';

	type Props = {
		wallet: IcrcWallet | undefined;
	};

	let { wallet }: Props = $props();

	const INVALID_LEDGER_CANISTER_ID = import.meta.env.VITE_SATELLITE_ID;

	const icrc1Transfer = async () => {
		// TODO: handle errors
		if (isNullish($authStore.identity)) {
			return;
		}

		const account = $accountsStore?.[0];

		if (isNullish(account)) {
			return;
		}

		const params: TransferParams = {
			to: {
				owner: $authStore.identity.getPrincipal(),
				subaccount: []
			},
			amount: 1n * (E8S_PER_ICP / 2n)
		};

		await wallet?.transfer({
			owner: account.owner,
			params,
			ledgerCanisterId: INVALID_LEDGER_CANISTER_ID
		});
	};

	const icrc2Approve = async () => {
		// TODO: handle errors
		if (isNullish($authStore.identity)) {
			return;
		}

		const account = $accountsStore?.[0];

		if (isNullish(account)) {
			return;
		}

		const params: ApproveParams = {
			spender: {
				owner: $authStore.identity.getPrincipal(),
				subaccount: []
			},
			amount: 1n * (E8S_PER_ICP / 2n),
			fee: 12_000n
		};

		await wallet?.approve({
			owner: account.owner,
			params,
			ledgerCanisterId: INVALID_LEDGER_CANISTER_ID
		});
	};
</script>

{#if nonNullish(wallet) && nonNullish($accountsStore)}
	<div in:fade class="mt-4">
		<Value id="build-consent-message" testId="build-consent-message" title="Build Consent Message">
			<div class="flex flex-col gap-2 w-fit">
				<Button onclick={icrc1Transfer} testId="build-icrc1-transfer-button">icrc1_transfer</Button>

				<Button onclick={icrc2Approve} testId="build-icrc2-approve-button">icrc2_approve</Button>
			</div>
		</Value>
	</div>
{/if}
