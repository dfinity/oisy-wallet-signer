<script lang="ts">
	import type { Principal } from '@icp-sdk/core/principal';
	import Value from '$core/components/Value.svelte';
	import { shortenWithMiddleEllipsis } from '$core/utils/format.utils';

	interface Props {
		shorten?: boolean;
		user?: Principal;
		title?: string;
	}

	let { shorten, user, title = 'Your User ID' }: Props = $props();

	let userId = $derived(user?.toText() ?? '');
</script>

<Value id="user-id-section" {title}>
	<output data-tid="user-id"
		>{shorten ? shortenWithMiddleEllipsis({ text: userId }) : userId}</output
	>
</Value>
