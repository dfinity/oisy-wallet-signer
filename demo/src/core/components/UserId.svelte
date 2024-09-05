<script lang="ts">
	import { authStore } from '../stores/auth.store';
	import Value from '$core/components/Value.svelte';
</script>

<Value id="user-id-section" title="User ID">
	<output data-tid="user-id">{$authStore?.identity?.getPrincipal().toText() ?? ''}</output>
</Value>
