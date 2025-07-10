<script lang="ts">
	import type { IcrcAccount } from '@dfinity/oisy-wallet-signer';
	import { IcrcWallet } from '@dfinity/oisy-wallet-signer/icrc-wallet';
	import { alertStore } from '$core/stores/alert.store';
	import IconAdd from '$lib/components/IconAdd.svelte';
	import { walletUrlStore } from '$lib/stores/wallet.store';

	interface Props {
		account: IcrcAccount | undefined;
	}

	let { account = $bindable() }: Props = $props();

	let wallet = $state<IcrcWallet | undefined>(undefined);

	const onclick = async () => {
		try {
			wallet = await IcrcWallet.connect({
				url: $walletUrlStore
			});

			const { allPermissionsGranted } = await wallet.requestPermissionsNotGranted();

			if (!allPermissionsGranted) {
				return;
			}

			const accounts = await wallet.accounts();

			account = accounts?.[0];
		} catch (err: unknown) {
			alertStore.set({
				type: 'error',
				message: 'The wallet did not provide any account.'
			});

			console.error(err);
			return;
		} finally {
			await wallet?.disconnect();
		}
	};

	const disconnect = () => wallet?.disconnect();
</script>

<svelte:window onoisyDemoDisconnectWallet={disconnect} />

<button
	{onclick}
	data-tid="connect-wallet-button"
	class="flex flex-col items-center w-[100%] min-h-40 mt-4 mb-8 pt-2 px-4 pb-4 border-black dark:border-lavender-blue-500 border-[3px] rounded bg-white dark:bg-black dark:text-white transition-all shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#7888FF] hover:text-white hover:bg-lavender-blue-600 dark:hover:bg-lavender-blue-300 dark:hover:text-black active:bg-lavender-blue-400 dark:active:bg-lavender-blue-500 active:shadow-none active:translate-x-[5px] active:translate-y-[5px]"
>
	<IconAdd />
	<span class="font-bold">Connect Wallet</span>
</button>
