<script lang="ts">
	import Button from '$core/components/Button.svelte';
	import { authStore } from '$core/stores/auth.store';
	import { emit } from '$core/utils/events.utils';

	const onClick = async () => {
		await fetch(
			`http://localhost:5999/ledger/transfer/?to=${$authStore.identity?.getPrincipal() ?? ''}`
		);

		emit({
			message: 'oisyDemoReloadBalance'
		});
	};
</script>

<div class="mt-4">
	<Button type="button" onclick={onClick} testId="get-icp-button">Get ICP</Button>
</div>
