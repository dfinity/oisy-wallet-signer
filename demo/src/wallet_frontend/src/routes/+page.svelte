<script lang="ts">
	import { notSignedIn } from '$core/derived/auth.derived';
	import { Signer } from '@dfinity/oisy-wallet-signer/signer';
	import UserId from '$core/components/UserId.svelte';
	import ConfirmPermissions from '$lib/ConfirmPermissions.svelte';

	let signer: Signer | undefined = $state(undefined);

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
</script>

<UserId />

<ConfirmPermissions {signer} />
