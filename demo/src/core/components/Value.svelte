<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		id: string;
		title: string;
		testId?: string;
		children: Snippet;
	};

	let { children, id, title, testId }: Props = $props();
</script>

<label class="font-bold text-sm" for={id} data-tid={testId}>{title}:</label>
<div class="text-sm mb-2" {id}>{@render children()}</div>
