<script lang="ts">
	import Button from '$core/components/Button.svelte';
	import { PROD } from '$core/constants/app.constants';
	import { authStore } from '$core/stores/auth.store';
	import { emit } from '$core/utils/events.utils';

	const onClick = async () => {
		// The faucet is a local-only Juno satellite (see demo/docker-compose.yml) used for local
		// development and E2E. Guard the call so it never fires from a production build.
		if (!PROD) {
			await fetch(
				`http://localhost:5999/ledger/transfer/?to=${$authStore.identity?.getPrincipal() ?? ''}`
			);
		}

		emit({
			message: 'oisyDemoReloadBalance'
		});
	};
</script>

<div class="mt-4">
	<Button type="button" onclick={onClick} testId="get-icp-button">Get ICP</Button>
</div>
