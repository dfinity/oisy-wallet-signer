<script lang="ts">
	import type { Signer } from '@dfinity/oisy-wallet-signer/signer';
	import { isNullish } from '@dfinity/utils';
	import {
		ICRC25_REQUEST_PERMISSIONS,
		type IcrcRequestedScopes
	} from '@dfinity/oisy-wallet-signer';

	type Props = {
		signer: Signer | undefined;
	};

	let { signer }: Props = $props();

	$effect(() => {
		if (isNullish(signer)) {
			return;
		}

		signer.on({
			method: ICRC25_REQUEST_PERMISSIONS,
			callback: (data: IcrcRequestedScopes) => {
				console.log('TODO: Handle permissions requests:', data);
			}
		});
	});
</script>

<p>TODO: permissions</p>
