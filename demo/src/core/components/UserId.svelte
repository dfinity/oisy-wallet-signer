<script lang="ts">
	import { authStore } from '../stores/auth.store';
	import Value from '$core/components/Value.svelte';
</script>

<Value id="user-id" title="User ID">
	<output>{$authStore?.identity?.getPrincipal().toText() ?? ''}</output>
</Value>
