<script lang="ts">
	import Button from '$core/components/Button.svelte';
	import { IcpWallet } from '@dfinity/oisy-wallet-signer/icp-wallet';
	import { WALLET_URL } from '$core/constants/app.constants';
	import { alertStore } from '$core/stores/alert.store';
	import type { IcrcAccount } from '@dfinity/oisy-wallet-signer';
	import Article from '$core/components/Article.svelte';
	import IconAdd from '$lib/components/IconAdd.svelte';

	type Props = {
		account: IcrcAccount | undefined;
	};

	let { account = $bindable() }: Props = $props();

	const onclick = async () => {
		let wallet: IcpWallet | undefined;

		try {
			wallet = await IcpWallet.connect({
				url: WALLET_URL
			});

			const permissions = await wallet.permissions();

			const requestPermissionsIfNeeded = async () => {
				const notGrantedScopes = permissions
					.filter(({ state }) => state !== 'granted')
					.map(({ scope }) => scope);

				if (notGrantedScopes.length === 0) {
					return;
				}

				await wallet?.requestPermissions({
					params: {
						scopes: notGrantedScopes
					}
				});
			};

			await requestPermissionsIfNeeded();

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
</script>

<button
	{onclick}
	data-tid="connect-wallet-button"
	class="flex flex-col items-center w-[100%] min-h-40 mt-4 mb-8 pt-2 px-4 pb-4 border-black dark:border-lavender-blue-500 border-[3px] rounded bg-white dark:bg-black dark:text-white transition-all shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#7888FF] hover:text-white hover:bg-lavender-blue-600 dark:hover:bg-lavender-blue-300 dark:hover:text-black active:bg-lavender-blue-400 dark:active:bg-lavender-blue-500 active:shadow-none active:translate-x-[5px] active:translate-y-[5px]"
>
	<IconAdd />
	<span class="font-bold">Connect Wallet</span>
</button>
