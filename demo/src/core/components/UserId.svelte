<script lang="ts">
	import { authStore } from '../stores/auth.store.js';
</script>

<label class="font-bold text-sm" for="user-id">User ID:</label>
<p class="text-sm mb-2">
	<output id="user-id">{$authStore?.identity?.getPrincipal().toText() ?? ''}</output>
</p>
