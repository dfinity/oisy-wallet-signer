<script lang="ts">
	import { notSignedIn } from '$core/derived/auth.derived';
	import { Signer } from '@dfinity/oisy-wallet-signer/signer';
	import UserId from '$core/components/UserId.svelte';
	import { ICRC25_REQUEST_PERMISSIONS, type IcrcScopes } from '@dfinity/oisy-wallet-signer';

	let signer: Signer | undefined;

	$effect(() => {
		if ($notSignedIn) {
			signer?.disconnect();
			return;
		}

		signer = Signer.init({});

		signer.on({
			method: ICRC25_REQUEST_PERMISSIONS,
			callback: (data: IcrcScopes) => {
				console.log('TODO: Handle permissions requests:', data);
			}
		});

		return () => {
			signer?.disconnect();
		};
	});
</script>

<UserId />
