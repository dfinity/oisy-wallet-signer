<script lang="ts">
	import Layout from '$core/components/Layout.svelte';
	import '$core/styles/app.scss';
	import { WALLET_POPUP_HEIGHT, WALLET_POPUP_WIDTH } from '$core/constants/app.constants';

	const size = {
		width: WALLET_POPUP_WIDTH,
		height: WALLET_POPUP_HEIGHT
	};
</script>

<Layout {size}>
	<svelte:fragment slot="title">Wallet 👛</svelte:fragment>

	<slot />
</Layout>
