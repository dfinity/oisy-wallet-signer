<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		onclick?: () => void;
		children: Snippet;
		testId: string;
		type?: 'button' | 'submit' | 'reset';
	};

	let { onclick, children, testId, type = 'button' }: Props = $props();
</script>

<button
	{type}
	{onclick}
	class="flex gap-2 items-center bg-white border border-blue px-4 py-2 rounded-xl my-2"
	data-tid={testId}>{@render children()}</button
>
