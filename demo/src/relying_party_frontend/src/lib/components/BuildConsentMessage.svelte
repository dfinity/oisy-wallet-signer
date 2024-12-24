<script lang="ts">
	import type { IcpWallet } from '@dfinity/oisy-wallet-signer/icp-wallet';
	import { isNullish, nonNullish } from '@dfinity/utils';
	import { fade } from 'svelte/transition';
	import Button from '$core/components/Button.svelte';
	import Value from '$core/components/Value.svelte';
	import { accountsStore } from '$lib/stores/accounts.store';
	import { authStore } from '$core/stores/auth.store';
	import type { Icrc1TransferRequest } from '@dfinity/ledger-icp';
	import { E8S_PER_ICP } from '$core/constants/app.constants';

	type Props = {
		wallet: IcpWallet | undefined;
	};

	let { wallet }: Props = $props();

	const INVALID_LEDGER_CANISTER_ID = import.meta.env.VITE_SATELLITE_ID;
	console.log(INVALID_LEDGER_CANISTER_ID)

	const onclick = async () => {
		// TODO: handle errors
		if (isNullish($authStore.identity)) {
			return;
		}

		if (isNullish($accountsStore)) {
			return;
		}

		const account = $accountsStore?.[0];

		if (isNullish(account)) {
			return;
		}

		const request: Icrc1TransferRequest = {
			to: {
				owner: $authStore.identity.getPrincipal(),
				subaccount: []
			},
			amount: 1n * (E8S_PER_ICP / 2n)
		};

		await wallet?.icrc1Transfer({
			owner: account.owner,
			request,
			ledgerCanisterId: INVALID_LEDGER_CANISTER_ID
		});
	};
</script>

{#if nonNullish(wallet) && nonNullish($accountsStore)}
	<div in:fade class="mt-4">
		<Value id="build-consent-message" testId="build-consent-message" title="Build Consent Message">
			<Button {onclick} testId="build-consent-message-button">Build</Button>
		</Value>
	</div>
{/if}
