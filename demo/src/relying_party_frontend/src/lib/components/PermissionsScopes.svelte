<script lang="ts">
	import type { IcrcScopesArray } from '@dfinity/oisy-wallet-signer';

	interface Props {
		scopes: IcrcScopesArray;
	}

	let { scopes }: Props = $props();
</script>

{#each scopes as scope (scope.scope.method)}
	<p>{scope.scope.method}: <strong>{scope.state}</strong></p>
{/each}
