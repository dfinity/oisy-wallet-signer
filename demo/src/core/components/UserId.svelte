<script lang="ts">
	import { authStore } from '../stores/auth.store';
	import Value from '$core/components/Value.svelte';
	import { shortenWithMiddleEllipsis } from '$core/utils/format.utils';

	type Props = {
		shorten?: boolean;
	};

	let { shorten }: Props = $props();

	let userId = $derived($authStore?.identity?.getPrincipal().toText() ?? '');
</script>

<Value id="user-id-section" title="Your User ID">
	<output data-tid="user-id"
		>{shorten ? shortenWithMiddleEllipsis({ text: userId }) : userId}</output
	>
</Value>
