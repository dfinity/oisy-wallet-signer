<script lang="ts">
	import { notSignedIn } from '$core/derived/auth.derived';
	import { Signer } from '@dfinity/oisy-wallet-signer/signer';
	import UserId from '$core/components/UserId.svelte';
	import ConfirmPermissions from '$lib/ConfirmPermissions.svelte';
	import { authStore } from '$core/stores/auth.store';
	import { isNullish } from '@dfinity/utils';
	import ConfirmAccounts from '$lib/ConfirmAccounts.svelte';

	let signer: Signer | undefined = $state(undefined);

	$effect(() => {
		if ($notSignedIn) {
			signer?.disconnect();
			return;
		}

		if (isNullish($authStore.identity)) {
			signer?.disconnect();
			return;
		}

		signer = Signer.init({
			owner: $authStore.identity
		});

		return () => {
			signer?.disconnect();
		};
	});
</script>

<UserId />

<ConfirmPermissions {signer} />

<ConfirmAccounts {signer} />
