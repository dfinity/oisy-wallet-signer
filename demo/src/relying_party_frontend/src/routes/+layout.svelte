<script lang="ts">
	import '$core/styles/app.css';
	import type { Snippet } from 'svelte';
	import Layout from '$core/components/Layout.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

{#snippet title()}
	Give me my ICP
{/snippet}

{#snippet description()}
	This sample app demonstrates how a relying party can interact with the Oisy Wallet, enabling
	secure message signing on the Internet Computer.
{/snippet}

<Layout {title} {description}>
	{@render children()}
</Layout>
