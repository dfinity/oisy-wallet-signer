<script lang="ts">
	import type { IcpWallet } from '@dfinity/oisy-wallet-signer/icp-wallet';
	import { isNullish, nonNullish } from '@dfinity/utils';
	import { fade } from 'svelte/transition';
	import Button from '$core/components/Button.svelte';
	import Value from '$core/components/Value.svelte';
	import type { IcrcCallCanisterResult } from '@dfinity/oisy-wallet-signer';
	import { accountsStore } from '$lib/stores/accounts.store';
	import { authStore } from '$core/stores/auth.store';
	import type { Icrc1TransferRequest } from '@dfinity/ledger-icp';
	import Balance from '$core/components/Balance.svelte';

	type Props = {
		wallet: IcpWallet | undefined;
	};

	let { wallet }: Props = $props();

	let result = $state<IcrcCallCanisterResult | undefined>(undefined);

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
			amount: 123n
		};

		result = await wallet?.icrc1Transfer({
			owner: account.owner,
			request
		});
	};

	const onreset = async () => {
		result = undefined;
	};
</script>

{#if nonNullish(wallet) && nonNullish($accountsStore)}
	<div in:fade>
		<Balance />

		<Value id="call-canister" testId="call-canister" title="Call Canister">
			{#if nonNullish(result)}
				<Button onclick={onreset} testId="reset-call-canister-button">Reset result</Button>
			{:else}
				<Button {onclick} testId="call-canister-button">Execute</Button>
			{/if}
		</Value>
	</div>
{/if}
