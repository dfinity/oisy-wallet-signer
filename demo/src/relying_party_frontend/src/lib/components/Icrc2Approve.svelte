<script lang="ts">
	import type { IcrcBlockIndex, ApproveParams } from '@dfinity/ledger-icrc';
	import type { IcrcWallet } from '@dfinity/oisy-wallet-signer/icrc-wallet';
	import { isNullish, nonNullish } from '@dfinity/utils';
	import Button from '$core/components/Button.svelte';
	import { E8S_PER_ICP, ICP_LEDGER_CANISTER_ID } from '$core/constants/app.constants';
	import { authStore } from '$core/stores/auth.store';
	import { accountsStore } from '$lib/stores/accounts.store';

	interface Props {
		wallet: IcrcWallet | undefined;
	}

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

		const params: ApproveParams = {
			spender: {
				owner: $authStore.identity.getPrincipal(),
				subaccount: []
			},
			amount: 1n * (E8S_PER_ICP / 2n)
		};

		result = await wallet?.approve({
			ledgerCanisterId: ICP_LEDGER_CANISTER_ID,
			owner: account.owner,
			params
		});
	};

	const onreset = () => {
		result = undefined;
	};
</script>

{#if nonNullish(result)}
	<Button onclick={onreset} testId="reset-icrc2-approve-button">Reset icrc2_approve</Button>
{:else}
	<Button {onclick} testId="call-icrc2-approve-button">icrc2_approve</Button>
{/if}
