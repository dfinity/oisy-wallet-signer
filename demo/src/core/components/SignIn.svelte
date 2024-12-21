<script lang="ts">
	import Button from '$core/components/Button.svelte';
	import IconSignIn from '$core/components/IconSignIn.svelte';
	import { authStore } from '$core/stores/auth.store';

	interface Props {
		size?: {
			width: number;
			height: number;
		};
	}

	let { size }: Props = $props();

	const onclick = async () => {
		await authStore.signIn({ size });
	};
</script>

<Button {onclick} testId="login-button"><IconSignIn /> Sign-in</Button>
