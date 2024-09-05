<script lang="ts">
	import type { Wallet } from '@dfinity/oisy-wallet-signer/wallet';
	import { isNullish, nonNullish } from '@dfinity/utils';
	import { fade } from 'svelte/transition';
	import Button from '$core/components/Button.svelte';
	import Value from '$core/components/Value.svelte';
	import type { IcrcCallCanisterResult } from '@dfinity/oisy-wallet-signer';
	import { accountsStore } from '$lib/stores/accounts.store';
	import { IDL } from '@dfinity/candid';
	import type { TransferArg } from '@dfinity/ledger-icp/dist/candid/ledger';
	import { Principal } from '@dfinity/principal';

	type Props = {
		wallet: Wallet | undefined;
	};

	let { wallet }: Props = $props();

	let result = $state<IcrcCallCanisterResult | undefined>(undefined);

	const onclick = async () => {
		// TODO: handle errors
		if (isNullish($accountsStore)) {
			return;
		}

		const account = $accountsStore?.[0];

		if (isNullish(account)) {
			return;
		}

		const SubAccount = IDL.Vec(IDL.Nat8);

		const Icrc1Tokens = IDL.Nat;

		const Icrc1Timestamp = IDL.Nat64;

		const Account = IDL.Record({
			owner: IDL.Principal,
			subaccount: IDL.Opt(SubAccount)
		});

		const TransferArg = IDL.Record({
			to: Account,
			fee: IDL.Opt(Icrc1Tokens),
			memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
			from_subaccount: IDL.Opt(SubAccount),
			created_at_time: IDL.Opt(Icrc1Timestamp),
			amount: Icrc1Tokens
		});

		const arg: TransferArg = {
			to: {
				owner: Principal.fromText(account.owner),
				subaccount: []
			},
			created_at_time: [],
			from_subaccount: [],
			memo: [],
			amount: 123n,
			fee: []
		};

		// TODO: we want to create and expose opiniated version WalletIcrc and WalletICP to ease the client integration.
		//
		// Basically:
		// Wallet -> RelyingParty
		// class WalletICP extends RelyingParty
		//
		// result = wallet?.icrc1_transfer({
		// 	params: {
		// 		sender: account.owner,
		// 		canisterId: "ryjl3-tyaaa-aaaaa-aaaba-cai",
		// 		myValue
		// 	}
		// })
		//
		// interface Params {
		// 	arg: Uint8Array | {
		// 		value: T, type: D
		// 	}
		// }

		result = await wallet?.call({
			params: {
				sender: account.owner,
				method: 'icrc1_transfer',
				canisterId: 'ryjl3-tyaaa-aaaaa-aaaba-cai',
				arg,
				argType: TransferArg
			}
		});
	};

	const onreset = async () => {
		result = undefined;
	};
</script>

{#if nonNullish(wallet) && nonNullish($accountsStore)}
	<div in:fade>
		<Value id="call-canister" testId="call-canister" title="Call Canister">
			{#if nonNullish(result)}
				<Button onclick={onreset} testId="reset-call-canister-button">Reset result</Button>
			{:else}
				<Button {onclick} testId="call-canister-button">Execute</Button>
			{/if}
		</Value>
	</div>
{/if}
