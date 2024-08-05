<script lang="ts">
	import { notSignedIn } from '$core/derived/auth.derived';
	import { Signer } from '@dfinity/oisy-wallet-signer/signer';
	import UserId from '$core/components/UserId.svelte';

	let signer: Signer | undefined;

	$effect(() => {
		if ($notSignedIn) {
			signer?.disconnect();
			return;
		}

		signer = Signer.init({});
	});
</script>

<UserId />
