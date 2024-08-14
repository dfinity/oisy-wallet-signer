<script lang="ts">
	import type { IcrcScopesArray } from '@dfinity/oisy-wallet-signer';

	type Props = {
		scopes: IcrcScopesArray;
	};

	let { scopes }: Props = $props();
</script>

{#each scopes as scope}
	<p>{scope.scope.method}: <strong>{scope.state}</strong></p>
{/each}
