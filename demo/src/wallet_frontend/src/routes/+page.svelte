<script lang="ts">
	import { notSignedIn } from '$core/derived/auth.derived';
	import { Signer } from '@dfinity/oisy-wallet-signer/signer';
	import UserId from '$core/components/UserId.svelte';
	import ConfirmPermissions from '$lib/ConfirmPermissions.svelte';
	import { authStore } from '$core/stores/auth.store';
	import { isNullish } from '@dfinity/utils';
	import { type PermissionsRequestsParams } from '@dfinity/oisy-wallet-signer';

	let signer: Signer | undefined = $state(undefined);

	let permissionsRequests: PermissionsRequestsParams | undefined = $state(undefined);

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
			owner: $authStore.identity.getPrincipal(),
			permissionsRequests: (requests) => (permissionsRequests = requests)
		});

		return () => {
			signer?.disconnect();
		};
	});
</script>

<UserId />

<ConfirmPermissions {signer} {permissionsRequests} />
