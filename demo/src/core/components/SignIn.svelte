<script lang="ts">
	import { authStore } from '$core/stores/auth.store';
	import Button from '$core/components/Button.svelte';
	import IconSignIn from '$core/components/IconSignIn.svelte';

	type Props = {
		size?: {
			width: number;
			height: number;
		};
	};

	let { size } = $props<Props>();

	const onclick = async () => {
		await authStore.signIn({ size });
	};
</script>

<Button {onclick}><IconSignIn /> Sign-in</Button>
