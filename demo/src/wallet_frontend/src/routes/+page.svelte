<script lang="ts">
	import { notSignedIn } from '$core/derived/auth.derived';
	import { Signer } from '@dfinity/oisy-wallet-signer/signer';
	import UserId from '$core/components/UserId.svelte';
	import {
		ICRC25_REQUEST_PERMISSIONS,
		type IcrcWalletScopesParams
	} from '@dfinity/oisy-wallet-signer';

	let signer: Signer | undefined;

	$effect(() => {
		if ($notSignedIn) {
			signer?.disconnect();
			return;
		}

		signer = Signer.init({});

		const unsubscribeRequestPermissions = signer.on({
			method: ICRC25_REQUEST_PERMISSIONS,
			callback: (data: IcrcWalletScopesParams) => {
				console.log('TODO: Handle permissions requests:', data);
			}
		});

		// I can unsubscribe just one listener.
		setTimeout(() => unsubscribeRequestPermissions(), 2000);

		return () => {
			signer?.disconnect();
		};
	});
</script>

<UserId />
