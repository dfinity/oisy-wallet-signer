<script lang="ts">
	import Layout from '$core/components/Layout.svelte';
	import '$core/styles/app.scss';
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
	};

	let { children }: Props = $props();
</script>

{#snippet title()}
	Relying Party
{/snippet}

{#snippet description()}
	This sample app demonstrates how a relying party can interact with the Oisy Wallet, enabling
	secure message signing on the Internet Computer.
{/snippet}

<Layout {title} {description}>
	{@render children()}
</Layout>
