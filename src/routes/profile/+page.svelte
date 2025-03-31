<script>
	import { goto } from '$app/navigation';
	import { resolveRoute } from '$app/paths';
	import { onMount } from 'svelte';

	onMount(() => {
		// Redirect to homepage
		goto(resolveRoute('/'));
	});
</script>

<div>Redirecting to homepage...</div>
