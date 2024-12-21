<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		id: string;
		title: string;
		testId?: string;
		children: Snippet;
	}

	let { children, id, title, testId }: Props = $props();
</script>

<div data-tid={testId} class="dark:text-white">
	<label class="font-bold" for={id}>{title}:</label>
	<div class="mb-2" {id}>{@render children()}</div>
</div>
