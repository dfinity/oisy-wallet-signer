<script lang="ts">
	import Layout from '$core/components/Layout.svelte';
	import '$core/styles/app.scss';
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
	};

	let { children } = $props<Props>();
</script>

{#snippet title()}
	Relying Party 🥳
{/snippet}

<Layout {title}>
	{@render children()}
</Layout>
