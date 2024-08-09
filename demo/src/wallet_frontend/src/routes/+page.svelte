<script lang="ts">
	import { notSignedIn } from '$core/derived/auth.derived';
	import { Signer } from '@dfinity/oisy-wallet-signer/signer';
	import UserId from '$core/components/UserId.svelte';
	import { ICRC25_REQUEST_PERMISSIONS } from '@dfinity/oisy-wallet-signer';

	let signer: Signer | undefined;

	$effect(() => {
		if ($notSignedIn) {
			signer?.disconnect();
			return;
		}

		signer = Signer.init({});

		return () => {
			signer?.disconnect();
		};
	});

	// TODO: to be removed.
	console.log(ICRC25_REQUEST_PERMISSIONS);
</script>

<UserId />
