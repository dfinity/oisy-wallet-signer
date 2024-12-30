<script lang="ts">
	import type { IcpWallet } from '@dfinity/oisy-wallet-signer/icp-wallet';
	import { isNullish, nonNullish } from '@dfinity/utils';
	import { fade } from 'svelte/transition';
	import Button from '$core/components/Button.svelte';
	import Value from '$core/components/Value.svelte';
	import { accountsStore } from '$lib/stores/accounts.store';
	import { authStore } from '$core/stores/auth.store';
	import type { BlockHeight, Icrc1TransferRequest, Icrc2ApproveRequest } from '@dfinity/ledger-icp';
	import { E8S_PER_ICP } from '$core/constants/app.constants';
	import { emit } from '$core/utils/events.utils';

	type Props = {
		wallet: IcpWallet | undefined;
	};

	let { wallet }: Props = $props();

	let result = $state<BlockHeight | undefined>(undefined);

	const onclick = async () => {
		// TODO: handle errors
		if (isNullish($authStore.identity)) {
			return;
		}

		const account = $accountsStore?.[0];

		if (isNullish(account)) {
			return;
		}

		const request: Icrc2ApproveRequest = {
			spender: {
				owner: $authStore.identity.getPrincipal(),
				subaccount: []
			},
			amount: 1n * (E8S_PER_ICP / 2n)
		};

		result = await wallet?.icrc2Approve({
			owner: account.owner,
			request
		});
	};

	const onreset = async () => {
		result = undefined;
	};
</script>

{#if nonNullish(result)}
	<Button onclick={onreset} testId="reset-icrc2-approve-button">Reset icrc2_approve</Button>
{:else}
	<Button {onclick} testId="call-icrc2-approve-button">icrc2_approve</Button>
{/if}
