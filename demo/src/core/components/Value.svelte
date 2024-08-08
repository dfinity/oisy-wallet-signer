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

<div data-tid={testId}>
	<label class="font-bold text-sm" for={id}>{title}:</label>
	<div class="text-sm mb-2" {id}>{@render children()}</div>
</div>
